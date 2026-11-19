import type { ExpressionBuilder } from 'kysely';

import { createEvents } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import type { DB, ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely/database';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'reseaux/linked-fields-sync' });

/** Correlated subquery reading a field of the parent RC of the current construction row. */
const parentReseauDeChaleurField = (
  eb: ExpressionBuilder<DB, 'zones_et_reseaux_en_construction'>,
  column: 'Identifiant reseau' | 'Gestionnaire' | 'MO' | 'nom_reseau' | 'organization_id'
) =>
  eb
    .selectFrom('reseaux_de_chaleur')
    .select(`reseaux_de_chaleur.${column}`)
    .whereRef('reseaux_de_chaleur.id_fcu', '=', 'zones_et_reseaux_en_construction.reseau_de_chaleur_id');

/**
 * Keeps the redundant link-derived network fields consistent:
 * - extensions (linked to a parent RC): mirror the parent's SNCU, `nom_reseau`, `Gestionnaire`,
 *   `MO` and organization (strict copies — the parent RC is the single source, edits happen on the parent),
 *   and hand over to the parent what the same team handles (see {@link consolidateExtensionsIntoParents});
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
      organization_id: parentReseauDeChaleurField(eb, 'organization_id'),
    }))
    .where('reseau_de_chaleur_id', 'is not', null)
    .where((eb) =>
      eb.or([
        eb(eb.ref('gestionnaire'), 'is distinct from', parentReseauDeChaleurField(eb, 'Gestionnaire')),
        eb(eb.ref('MO'), 'is distinct from', parentReseauDeChaleurField(eb, 'MO')),
        eb(eb.ref('nom_reseau'), 'is distinct from', parentReseauDeChaleurField(eb, 'nom_reseau')),
        eb(eb.ref('organization_id'), 'is distinct from', parentReseauDeChaleurField(eb, 'organization_id')),
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

  const consolidation = await consolidateExtensionsIntoParents();

  const stats = {
    ...consolidation,
    extensionsOperatorUpdated: Number(extensionsResult?.numUpdatedRows ?? 0),
    extensionsSncuUpdated: Number(sncuResult?.numUpdatedRows ?? 0),
    pdpFilled: pdpUpdates.length,
    pdpLinksBackfilled: Number(pdpLinksResult?.numUpdatedRows ?? 0),
    pdpSncuUpdated: Number(pdpSncuResult?.numUpdatedRows ?? 0),
  };
  logger.info('synchronized linked network fields', stats);
  return stats;
};

/**
 * An extension linked to a heat network is handled by the team of its parent network, which therefore carries everything
 * that team works with: the demands (the extension stays their nearest network, in `extension_id`), the network permissions,
 * the `demand` reminders and the notes. Demands follow the link when it changes and go back to the extension when it is removed.
 */
const consolidateExtensionsIntoParents = async () => {
  const attachedDemands = await kdb
    .updateTable('demands')
    .from('zones_et_reseaux_en_construction as extension')
    .set((eb) => ({
      extension_id: eb.ref('demands.network_id'),
      network_id: eb.ref('extension.reseau_de_chaleur_id'),
      network_type: 'reseau_de_chaleur',
    }))
    .where('demands.network_type', '=', 'reseau_en_construction')
    .whereRef('demands.network_id', '=', 'extension.id_fcu')
    .where('extension.reseau_de_chaleur_id', 'is not', null)
    .executeTakeFirst();

  const relinkedDemands = await kdb
    .updateTable('demands')
    .from('zones_et_reseaux_en_construction as extension')
    .set((eb) => ({ network_id: eb.ref('extension.reseau_de_chaleur_id') }))
    .whereRef('demands.extension_id', '=', 'extension.id_fcu')
    .where('extension.reseau_de_chaleur_id', 'is not', null)
    .where((eb) => eb('demands.network_id', 'is distinct from', eb.ref('extension.reseau_de_chaleur_id')))
    .executeTakeFirst();

  const detachedDemands = await kdb
    .updateTable('demands')
    .from('zones_et_reseaux_en_construction as extension')
    .set((eb) => ({
      extension_id: null,
      network_id: eb.ref('demands.extension_id'),
      network_type: 'reseau_en_construction',
    }))
    .whereRef('demands.extension_id', '=', 'extension.id_fcu')
    .where('extension.reseau_de_chaleur_id', 'is', null)
    .executeTakeFirst();

  const movedReminders = await kdb
    .updateTable('network_reminders')
    .from('zones_et_reseaux_en_construction as extension')
    .set((eb) => ({
      network_id: eb.ref('extension.reseau_de_chaleur_id').$notNull(),
      network_type: 'reseau_de_chaleur',
    }))
    .where('network_reminders.network_type', '=', 'reseau_en_construction')
    .where('network_reminders.type', '=', 'demand')
    .whereRef('network_reminders.network_id', '=', 'extension.id_fcu')
    .where('extension.reseau_de_chaleur_id', 'is not', null)
    .executeTakeFirst();

  const [movedPermissions, movedNotes] = await Promise.all([moveExtensionPermissionsToParents(), moveExtensionNotesToParents()]);

  return {
    extensionsDemandsAttached: Number(attachedDemands?.numUpdatedRows ?? 0) + Number(relinkedDemands?.numUpdatedRows ?? 0),
    extensionsDemandsDetached: Number(detachedDemands?.numUpdatedRows ?? 0),
    extensionsNotesMoved: movedNotes,
    extensionsPermissionsMoved: movedPermissions,
    extensionsRemindersMoved: Number(movedReminders?.numUpdatedRows ?? 0),
  };
};

/**
 * Replaces every permission on a linked extension by a permission on its parent network (kept once when the account already
 * holds it), traced by a system `user_permissions_updated` event per account.
 */
const moveExtensionPermissionsToParents = async () => {
  const extensionPermissions = await kdb
    .selectFrom('user_permissions as permission')
    .innerJoin('zones_et_reseaux_en_construction as extension', (join) =>
      join.on((eb) => eb('permission.resource_id', '=', eb.cast<string>('extension.id_fcu', 'text')))
    )
    .innerJoin('users as holder', 'holder.id', 'permission.user_id')
    .select(['permission.id', 'permission.user_id', 'permission.resource_id', 'extension.reseau_de_chaleur_id', 'holder.email'])
    .where('permission.type', '=', 'reseau_en_construction')
    .where('extension.reseau_de_chaleur_id', 'is not', null)
    .$narrowType<{ reseau_de_chaleur_id: number }>()
    .execute();
  if (extensionPermissions.length === 0) {
    return 0;
  }

  const addedPermissions = await kdb.transaction().execute(async (trx) => {
    const added = await trx
      .insertInto('user_permissions')
      .values(
        extensionPermissions.map((permission) => ({
          resource_id: String(permission.reseau_de_chaleur_id),
          type: 'reseau_de_chaleur',
          user_id: permission.user_id,
        }))
      )
      .onConflict((conflict) => conflict.columns(['user_id', 'type', 'resource_id']).doNothing())
      .returning(['user_id', 'type', 'resource_id'])
      .execute();
    await trx
      .deleteFrom('user_permissions')
      .where(
        'id',
        'in',
        extensionPermissions.map((permission) => permission.id)
      )
      .execute();
    return added;
  });

  await createEvents(
    [...new Set(extensionPermissions.map((permission) => permission.user_id))].map((userId) => {
      const removed = extensionPermissions.filter((permission) => permission.user_id === userId);
      return {
        context_id: userId,
        context_type: 'user',
        data: {
          added: addedPermissions
            .filter((permission) => permission.user_id === userId)
            .map((permission) => ({ resource_id: permission.resource_id, type: permission.type })),
          removed: removed.map((permission) => ({ resource_id: permission.resource_id, type: 'reseau_en_construction' })),
          user_email: removed[0].email,
        },
        type: 'user_permissions_updated' as const,
      };
    })
  );
  return extensionPermissions.length;
};

/** Characters trimmed around a note before comparing it (Postgres `btrim` only removes spaces by default). */
const NOTE_PADDING = ' \n\r\t';

/**
 * Appends the notes of the linked extensions to those of their parent network, then clears them on the extensions.
 * The same team follows both, so the same note was often entered on each: a note the parent already holds is not repeated.
 */
const moveExtensionNotesToParents = async () =>
  kdb.transaction().execute(async (trx) => {
    const movedNotes = await trx
      .updateTable('reseaux_de_chaleur')
      .from(
        trx
          .selectFrom('zones_et_reseaux_en_construction as extension')
          .innerJoin('reseaux_de_chaleur as parent', 'parent.id_fcu', 'extension.reseau_de_chaleur_id')
          .select((eb) => [
            'extension.reseau_de_chaleur_id',
            eb.fn
              .agg<string>('string_agg', [eb.fn<string>('btrim', ['extension.notes', eb.val(NOTE_PADDING)]), eb.val('\n\n')])
              .distinct()
              .as('notes'),
          ])
          .where('extension.notes', 'is not', null)
          .where((eb) => eb(eb.fn<string>('btrim', ['extension.notes', eb.val(NOTE_PADDING)]), '!=', ''))
          .where((eb) =>
            eb(
              eb.fn<number>('strpos', [
                eb.fn.coalesce('parent.notes', eb.val('')),
                eb.fn<string>('btrim', ['extension.notes', eb.val(NOTE_PADDING)]),
              ]),
              '=',
              0
            )
          )
          .groupBy('extension.reseau_de_chaleur_id')
          .as('moved')
      )
      .set((eb) => ({
        notes: eb.fn<string>('concat_ws', [
          eb.val('\n\n'),
          eb.fn('nullif', [eb.ref('reseaux_de_chaleur.notes'), eb.val('')]),
          eb.ref('moved.notes'),
        ]),
      }))
      .whereRef('reseaux_de_chaleur.id_fcu', '=', 'moved.reseau_de_chaleur_id')
      .executeTakeFirst();
    await trx
      .updateTable('zones_et_reseaux_en_construction')
      .set({ notes: null })
      .where('reseau_de_chaleur_id', 'is not', null)
      .where('notes', 'is not', null)
      .execute();
    return Number(movedNotes?.numUpdatedRows ?? 0);
  });

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
