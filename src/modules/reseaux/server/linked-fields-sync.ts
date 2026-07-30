import type { ExpressionBuilder } from 'kysely';

import { kdb, sql } from '@/server/db/kysely';
import type { DB, ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely/database';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'reseaux/linked-fields-sync' });

/** Correlated subquery reading a field of the parent RC of the current construction row. */
const parentReseauDeChaleurField = (
  eb: ExpressionBuilder<DB, 'zones_et_reseaux_en_construction'>,
  column: 'Identifiant reseau' | 'Gestionnaire' | 'MO' | 'nom_reseau'
) =>
  eb
    .selectFrom('reseaux_de_chaleur')
    .select(`reseaux_de_chaleur.${column}`)
    .whereRef('reseaux_de_chaleur.id_fcu', '=', 'zones_et_reseaux_en_construction.reseau_de_chaleur_id');

/**
 * Keeps the redundant link-derived network fields consistent:
 * - extensions (linked to a parent RC): mirror the parent's SNCU, `nom_reseau`, `Gestionnaire`
 *   and `MO` (strict copies — the parent RC is the single source, edits happen on the parent);
 * - PDP: resolve legacy SNCU-only links into `reseau_de_chaleur_ids`, mirror the SNCU of a
 *   single linked RC, and fill empty `Gestionnaire`/`MO` when the linked value is unambiguous
 *   (never overwrites a non-empty value — ambiguities are surfaced by the data diagnostic).
 * Idempotent, safe to run at any time.
 */
export const syncLinkedNetworkFields = async () => {
  const sncuResult = await kdb
    .updateTable('zones_et_reseaux_en_construction')
    .set((eb) => ({
      'Identifiant reseau': parentReseauDeChaleurField(eb, 'Identifiant reseau'),
    }))
    .where((eb) => eb(eb.ref('Identifiant reseau'), 'is distinct from', parentReseauDeChaleurField(eb, 'Identifiant reseau')))
    .executeTakeFirst();

  // Strict mirror only while linked: unlinking keeps the last inherited values, which become editable again
  const extensionsResult = await kdb
    .updateTable('zones_et_reseaux_en_construction')
    .set((eb) => ({
      gestionnaire: parentReseauDeChaleurField(eb, 'Gestionnaire'),
      MO: parentReseauDeChaleurField(eb, 'MO'),
      nom_reseau: parentReseauDeChaleurField(eb, 'nom_reseau'),
    }))
    .where('reseau_de_chaleur_id', 'is not', null)
    .where((eb) =>
      eb.or([
        eb(eb.ref('gestionnaire'), 'is distinct from', parentReseauDeChaleurField(eb, 'Gestionnaire')),
        eb(eb.ref('MO'), 'is distinct from', parentReseauDeChaleurField(eb, 'MO')),
        eb(eb.ref('nom_reseau'), 'is distinct from', parentReseauDeChaleurField(eb, 'nom_reseau')),
      ])
    )
    .executeTakeFirst();

  // Legacy convergence: PDP historically linked by SNCU text only → resolve into reseau_de_chaleur_ids
  const pdpLinksResult = await kdb
    .updateTable('zone_de_developpement_prioritaire')
    .set((eb) => ({
      reseau_de_chaleur_ids: sql<number[]>`ARRAY(${eb
        .selectFrom('reseaux_de_chaleur')
        .select('reseaux_de_chaleur.id_fcu')
        .whereRef('reseaux_de_chaleur.Identifiant reseau', '=', 'zone_de_developpement_prioritaire.Identifiant reseau')})::int[]`,
    }))
    .where(sql<number>`cardinality(${sql.ref('reseau_de_chaleur_ids')})`, '=', 0)
    .where('Identifiant reseau', 'is not', null)
    .where('Identifiant reseau', '!=', '')
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom('reseaux_de_chaleur')
          .select('reseaux_de_chaleur.id_fcu')
          .whereRef('reseaux_de_chaleur.Identifiant reseau', '=', 'zone_de_developpement_prioritaire.Identifiant reseau')
      )
    )
    .executeTakeFirst();

  // PDP SNCU mirror: a single linked RC imposes its SNCU (several linked RC → left to the admin)
  const pdpSncuResult = await kdb
    .updateTable('zone_de_developpement_prioritaire')
    .set((eb) => ({
      'Identifiant reseau': eb
        .selectFrom('reseaux_de_chaleur')
        .select('reseaux_de_chaleur.Identifiant reseau')
        .where('reseaux_de_chaleur.id_fcu', '=', sql<number>`(${eb.ref('zone_de_developpement_prioritaire.reseau_de_chaleur_ids')})[1]`),
    }))
    .where(sql<number>`cardinality(${sql.ref('reseau_de_chaleur_ids')})`, '=', 1)
    .where((eb) =>
      eb(
        eb.ref('Identifiant reseau'),
        'is distinct from',
        eb
          .selectFrom('reseaux_de_chaleur')
          .select('reseaux_de_chaleur.Identifiant reseau')
          .where('reseaux_de_chaleur.id_fcu', '=', sql<number>`(${eb.ref('zone_de_developpement_prioritaire.reseau_de_chaleur_ids')})[1]`)
      )
    )
    .executeTakeFirst();

  const pdps = await kdb
    .selectFrom('zone_de_developpement_prioritaire as pdp')
    .select((eb) => [
      'pdp.id_fcu',
      'pdp.Gestionnaire',
      'pdp.MO',
      linkedGestionnairesSQL(eb).as('linked_gestionnaires'),
      linkedMaitresOuvrageSQL(eb).as('linked_maitres_ouvrage'),
    ])
    .where((eb) =>
      eb.or([eb('pdp.Gestionnaire', 'is', null), eb('pdp.Gestionnaire', '=', ''), eb('pdp.MO', 'is', null), eb('pdp.MO', '=', '')])
    )
    .execute();

  const pdpUpdates = pdps
    .map((pdp) => {
      const gestionnaire = !pdp.Gestionnaire && pdp.linked_gestionnaires.length === 1 ? pdp.linked_gestionnaires[0] : undefined;
      const maitreOuvrage = !pdp.MO && pdp.linked_maitres_ouvrage.length === 1 ? pdp.linked_maitres_ouvrage[0] : undefined;
      return gestionnaire !== undefined || maitreOuvrage !== undefined
        ? { Gestionnaire: gestionnaire, id_fcu: pdp.id_fcu, MO: maitreOuvrage }
        : null;
    })
    .filter((update) => update !== null);

  await Promise.all(
    pdpUpdates.map((update) =>
      kdb
        .updateTable('zone_de_developpement_prioritaire')
        .set({
          ...(update.Gestionnaire !== undefined && { Gestionnaire: update.Gestionnaire }),
          ...(update.MO !== undefined && { MO: update.MO }),
        })
        .where('id_fcu', '=', update.id_fcu)
        .execute()
    )
  );

  const stats = {
    extensionsOperatorUpdated: Number(extensionsResult?.numUpdatedRows ?? 0),
    extensionsSncuUpdated: Number(sncuResult?.numUpdatedRows ?? 0),
    pdpFilled: pdpUpdates.length,
    pdpLinksBackfilled: Number(pdpLinksResult?.numUpdatedRows ?? 0),
    pdpSncuUpdated: Number(pdpSncuResult?.numUpdatedRows ?? 0),
  };
  logger.info('synchronized linked network fields', stats);
  return stats;
};

type PdpExpressionBuilder = ExpressionBuilder<DB & { pdp: ZoneDeDeveloppementPrioritaire }, 'pdp'>;

/**
 * Distinct non-empty `Gestionnaire` values among the networks linked to the current
 * PDP row (RC by SNCU or ids, constructions by ids), as a SQL array.
 * Also used by the data diagnostic to surface ambiguous PDP (several distinct values).
 */
export const linkedGestionnairesSQL = (eb: PdpExpressionBuilder) =>
  sql<string[]>`ARRAY(${eb
    .selectFrom('reseaux_de_chaleur as rc')
    .select('rc.Gestionnaire as value')
    .where((web) =>
      web.or([
        web.and([
          web('pdp.Identifiant reseau', 'is not', null),
          web('pdp.Identifiant reseau', '!=', ''),
          web(web.ref('rc.Identifiant reseau'), '=', web.ref('pdp.Identifiant reseau')),
        ]),
        web('rc.id_fcu', '=', sql<number>`ANY(${web.ref('pdp.reseau_de_chaleur_ids')})`),
      ])
    )
    .where('rc.Gestionnaire', 'is not', null)
    .where('rc.Gestionnaire', '!=', '')
    .union(
      eb
        .selectFrom('zones_et_reseaux_en_construction as zc')
        .select('zc.gestionnaire as value')
        .where('zc.id_fcu', '=', sql<number>`ANY(${eb.ref('pdp.reseau_en_construction_ids')})`)
        .where('zc.gestionnaire', 'is not', null)
        .where('zc.gestionnaire', '!=', '')
    )})`;

/** Same as {@link linkedGestionnairesSQL} for the `MO` (maître d'ouvrage) values. */
export const linkedMaitresOuvrageSQL = (eb: PdpExpressionBuilder) =>
  sql<string[]>`ARRAY(${eb
    .selectFrom('reseaux_de_chaleur as rc')
    .select('rc.MO as value')
    .where((web) =>
      web.or([
        web.and([
          web('pdp.Identifiant reseau', 'is not', null),
          web('pdp.Identifiant reseau', '!=', ''),
          web(web.ref('rc.Identifiant reseau'), '=', web.ref('pdp.Identifiant reseau')),
        ]),
        web('rc.id_fcu', '=', sql<number>`ANY(${web.ref('pdp.reseau_de_chaleur_ids')})`),
      ])
    )
    .where('rc.MO', 'is not', null)
    .where('rc.MO', '!=', '')
    .union(
      eb
        .selectFrom('zones_et_reseaux_en_construction as zc')
        .select('zc.MO as value')
        .where('zc.id_fcu', '=', sql<number>`ANY(${eb.ref('pdp.reseau_en_construction_ids')})`)
        .where('zc.MO', 'is not', null)
        .where('zc.MO', '!=', '')
    )})`;
