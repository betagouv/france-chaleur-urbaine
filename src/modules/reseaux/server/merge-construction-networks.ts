import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { airtableSynchronizableNetworkTableConfig } from '@/modules/reseaux/constants';
import { AirtableDB, type AirtableTable } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

import { updateEntityWithoutGeometry } from './geometry-operations';

/**
 * Fusion des réseaux/zones "en construction" dupliqués.
 *
 * Contexte : la table `zones_et_reseaux_en_construction` contient des tronçons d'un même réseau
 * livrés séparément par horizon temporel (une ligne par date de mise en service). On les regroupe
 * en une seule entité par réseau, avec une fourchette de dates et une géométrie fusionnée.
 *
 * Stratégie de regroupement (deux niveaux, cf. analyse) :
 *  - PART 1 (automatique, fiable) : même `nom_reseau` normalisé ET même dimension géométrique.
 *  - PART 2 (rapport seul, revue manuelle) : proximité spatiale + même gestionnaire mais noms
 *    différents — simplement signalés, jamais fusionnés automatiquement.
 *
 * Garde-fou : si un même nom mélange une ligne et une zone, on n'agrège pas (types incompatibles),
 * on lève une alerte.
 *
 * Déroulé (one-shot, dry-run par défaut) — tout est fait en UNE étape `--apply` :
 *  Par groupe, dans une transaction (atomique, re-run idempotent au niveau du groupe) :
 *   1. survivant (min id_fcu) : géométrie fusionnée + fourchette de dates + gestionnaire trim
 *      + notes concaténées depuis les absorbés.
 *   2. remap des FK : `demands.network_id`, `demands.pending_assignment_change` (JSON),
 *      `network_reminders.network_id`, `zone_de_developpement_prioritaire.reseau_en_construction_ids`.
 *   3. permissions : réassignation au survivant (`ON CONFLICT DO NOTHING`) puis suppression des
 *      permissions sur les ids absorbés (scopé — on ne purge PAS les orphelines préexistantes).
 *   4. suppression des lignes absorbées.
 *  Puis hors transaction : recalcul communes/dept/région/is_zone, et mise à jour Airtable
 *  (MAJ du survivant + suppression des records absorbés).
 *
 * `downloadNetwork` étant UPDATE-only (ni INSERT ni DELETE), supprimer en base est durable et la
 * géométrie fusionnée survit à une resync ; seuls nom/gestionnaire/mise_en_service sont réécrits
 * depuis Airtable, d'où la MAJ Airtable du survivant (sinon la fourchette serait écrasée).
 */

const NETWORK_TYPE = 'reseau_en_construction' as const;

const AIRTABLE_TABLE = airtableSynchronizableNetworkTableConfig['reseaux-en-construction'].airtable as AirtableTable;

// Seuils de détection des candidats par proximité (PART 2), en mètres (géométries en Lambert 93).
// Issus de l'analyse des données : 150 m capte les tronçons de tracés voisins, 50 m les zones
// adjacentes, sans coller des réseaux distincts d'un même secteur dense.
const PROXIMITY_EPS_LINE_METERS = 150;
const PROXIMITY_EPS_ZONE_METERS = 50;

/**
 * Fusions validées manuellement : tronçons d'un même réseau aux noms différents (donc non captés
 * par la clé nom+type), confirmés à la main via proximité + même gestionnaire. Fusionnés comme les
 * groupes auto. Le survivant reste min(id_fcu).
 */
const MANUAL_MERGE_GROUPS: { label: string; ids: number[] }[] = [];

/**
 * Candidats repérés mais NON fusionnés (décision en attente) — uniquement suivis et listés dans le
 * rapport, jamais modifiés. À trancher plus tard.
 */
const PENDING_REVIEW_GROUPS: { label: string; ids: number[]; reason: string }[] = [];

type GeomDimension = 'line' | 'polygon';

type ConstructionRow = {
  id_fcu: number;
  nom_reseau: string | null;
  mise_en_service: string | null;
  gestionnaire: string | null;
  notes: string | null;
  nom_norm: string;
  gtype: string;
};

type MergeGroup = {
  origin: 'auto' | 'manual';
  nomDisplay: string;
  dimension: GeomDimension;
  survivor: number;
  absorbed: number[];
  allIds: number[];
  dates: (string | null)[];
  fourchette: string | null;
  survivorGestionnaire: string | null;
  /** Notes concaténées (survivant + absorbés). `null` = aucun absorbé n'a de note → ne pas écrire. */
  mergedNotes: string | null;
};

type TypeConflict = {
  nomDisplay: string;
  items: { id_fcu: number; gtype: string }[];
};

type ProximityCandidate = {
  dimension: GeomDimension;
  gestionnaire: string;
  ids: number[];
  noms: string[];
};

/** Compteurs des écritures par groupe (réels en `--apply`, prévisionnels en dry-run). */
type RemapCounts = {
  demands: number;
  pending: number;
  reminders: number;
  zdp: number;
  permsCreated: number;
  permsDeleted: number;
};

/** Normalisation d'un libellé : minuscules, espaces compactés, trim. */
const normalizeColumn = (column: 'nom_reseau' | 'gestionnaire') =>
  sql<string>`lower(btrim(regexp_replace(coalesce(${sql.ref(column)}, ''), '[[:space:]]+', ' ', 'g')))`;

function geomDimension(gtype: string): GeomDimension | 'other' {
  const upper = gtype.toUpperCase();
  if (upper.includes('POLYGON')) return 'polygon';
  if (upper.includes('LINE')) return 'line';
  return 'other';
}

/** Fourchette d'années à partir des libellés de mise en service ("2026", "2026-2030", …). */
function computeDateRange(values: (string | null)[]): string | null {
  const years = values.flatMap((value) => (value ? [...value.matchAll(/\d{4}/g)].map((match) => Number(match[0])) : []));
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}-${max}`;
}

/**
 * Concatène les notes (texte libre) du groupe vers le survivant : note du survivant d'abord, puis
 * celles des absorbés non vides avec un en-tête de provenance. Pas d'analyse/dédup du contenu.
 * Retourne `null` si aucun absorbé n'a de note (on ne touche alors pas au survivant).
 */
function aggregateNotes(sorted: ConstructionRow[]): string | null {
  const survivor = sorted[0];
  const absorbedWithNotes = sorted.slice(1).filter((row) => (row.notes ?? '').trim() !== '');
  if (absorbedWithNotes.length === 0) return null;

  const blocks: string[] = [];
  const survivorNote = (survivor.notes ?? '').trim();
  if (survivorNote !== '') blocks.push(survivorNote);
  for (const row of absorbedWithNotes) {
    blocks.push(`— Note fusionnée depuis #${row.id_fcu} —\n${(row.notes ?? '').trim()}`);
  }
  return blocks.join('\n\n');
}

function buildMergeGroup(sorted: ConstructionRow[], origin: 'auto' | 'manual', dimension: GeomDimension): MergeGroup {
  return {
    absorbed: sorted.slice(1).map((row) => row.id_fcu),
    allIds: sorted.map((row) => row.id_fcu),
    dates: sorted.map((row) => row.mise_en_service),
    dimension,
    fourchette: computeDateRange(sorted.map((row) => row.mise_en_service)),
    mergedNotes: aggregateNotes(sorted),
    nomDisplay: sorted[0].nom_reseau ?? sorted[0].nom_norm,
    origin,
    survivor: sorted[0].id_fcu,
    survivorGestionnaire: sorted[0].gestionnaire,
  };
}

/** Charge les groupes par nom normalisé et sépare les fusions valides des conflits de type. */
async function loadGroups(): Promise<{ mergeable: MergeGroup[]; conflicts: TypeConflict[] }> {
  const rows = await kdb
    .selectFrom('zones_et_reseaux_en_construction')
    .select([
      'id_fcu',
      'nom_reseau',
      'mise_en_service',
      'gestionnaire',
      'notes',
      normalizeColumn('nom_reseau').as('nom_norm'),
      sql<string>`GeometryType(geom)`.as('gtype'),
    ])
    .execute();

  const byName = new Map<string, ConstructionRow[]>();
  for (const row of rows) {
    const group = byName.get(row.nom_norm) ?? [];
    group.push(row);
    byName.set(row.nom_norm, group);
  }

  const mergeable: MergeGroup[] = [];
  const conflicts: TypeConflict[] = [];

  for (const group of byName.values()) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => a.id_fcu - b.id_fcu);
    const dimensions = new Set(sorted.map((row) => geomDimension(row.gtype)));
    const nomDisplay = sorted[0].nom_reseau ?? sorted[0].nom_norm;

    if (dimensions.size > 1 || dimensions.has('other')) {
      conflicts.push({ items: sorted.map((row) => ({ gtype: row.gtype, id_fcu: row.id_fcu })), nomDisplay });
      continue;
    }

    mergeable.push(buildMergeGroup(sorted, 'auto', [...dimensions][0] as GeomDimension));
  }

  // Fusions manuelles validées (noms différents non captés par la clé auto).
  const rowById = new Map(rows.map((row) => [row.id_fcu, row]));
  for (const manual of MANUAL_MERGE_GROUPS) {
    const groupRows = manual.ids.map((id) => rowById.get(id)).filter((row): row is ConstructionRow => row !== undefined);
    if (groupRows.length < 2) {
      logger.warn(`Fusion manuelle « ${manual.label} » ignorée : ids introuvables ou insuffisants (${manual.ids.join(', ')})`);
      continue;
    }
    const sorted = [...groupRows].sort((a, b) => a.id_fcu - b.id_fcu);
    const dimensions = new Set(sorted.map((row) => geomDimension(row.gtype)));
    if (dimensions.size > 1 || dimensions.has('other')) {
      conflicts.push({ items: sorted.map((row) => ({ gtype: row.gtype, id_fcu: row.id_fcu })), nomDisplay: manual.label });
      continue;
    }
    mergeable.push(buildMergeGroup(sorted, 'manual', [...dimensions][0] as GeomDimension));
  }

  // Tracés d'abord, puis par taille décroissante : rapport lisible.
  mergeable.sort((a, b) => Number(a.dimension === 'polygon') - Number(b.dimension === 'polygon') || b.absorbed.length - a.absorbed.length);
  return { conflicts, mergeable };
}

/** PART 2 : clusters spatiaux à noms différents mais même gestionnaire (candidats à revue). */
async function findProximityCandidates(): Promise<ProximityCandidate[]> {
  const run = async (isZone: boolean, eps: number, dimension: GeomDimension): Promise<ProximityCandidate[]> => {
    const result = await sql<{ ids: number[]; noms: string[]; gestionnaire: string }>`
      WITH clusters AS (
        SELECT id_fcu, nom_reseau,
          ${normalizeColumn('gestionnaire')} AS gest_norm,
          ${normalizeColumn('nom_reseau')} AS nom_norm,
          ST_ClusterDBSCAN(geom, eps := ${sql.lit(eps)}, minpoints := 1) OVER () AS cid
        FROM zones_et_reseaux_en_construction
        WHERE is_zone = ${sql.lit(isZone)}
      )
      SELECT array_agg(id_fcu ORDER BY id_fcu) AS ids,
             array_agg(DISTINCT nom_reseau) AS noms,
             min(gest_norm) AS gestionnaire
      FROM clusters
      GROUP BY cid
      HAVING count(*) > 1 AND count(DISTINCT nom_norm) > 1 AND count(DISTINCT gest_norm) = 1
      ORDER BY cid
    `.execute(kdb);
    return result.rows.map((row) => ({ dimension, gestionnaire: row.gestionnaire, ids: row.ids, noms: row.noms }));
  };

  return [...(await run(false, PROXIMITY_EPS_LINE_METERS, 'line')), ...(await run(true, PROXIMITY_EPS_ZONE_METERS, 'polygon'))];
}

/** Applique réellement la fusion d'un groupe dans une transaction (atomique). */
async function applyMerge(group: MergeGroup): Promise<RemapCounts> {
  const absorbedStr = group.absorbed.map(String);

  return await kdb.transaction().execute(async (trx) => {
    // 1. Survivant : géométrie fusionnée + fourchette + gestionnaire trim + notes concaténées.
    await trx
      .with('merged', (db) =>
        db
          .selectFrom('zones_et_reseaux_en_construction')
          .select(sql<string>`ST_Multi(ST_Union(geom))`.as('geom'))
          .where('id_fcu', 'in', group.allIds)
      )
      .updateTable('zones_et_reseaux_en_construction')
      .where('id_fcu', '=', group.survivor)
      .set({
        geom: sql`ST_Force2D((SELECT geom FROM merged))`,
        gestionnaire: group.survivorGestionnaire?.trim() ?? null,
        mise_en_service: group.fourchette,
        ...(group.mergedNotes !== null ? { notes: group.mergedNotes } : {}),
      })
      .execute();

    // 2. Remap des FK logiques (pas de FK stricte en base → c'est le script qui garantit l'intégrité).
    const demands = await trx
      .updateTable('demands')
      .set({ network_id: group.survivor })
      .where('network_type', '=', NETWORK_TYPE)
      .where('network_id', 'in', group.absorbed)
      .executeTakeFirst();

    const pending = await trx
      .updateTable('demands')
      .set({ pending_assignment_change: sql`jsonb_set(pending_assignment_change, '{network_id}', to_jsonb(${group.survivor}::int))` })
      .where(sql<boolean>`pending_assignment_change->>'network_type' = ${NETWORK_TYPE}`)
      .where(sql<boolean>`(pending_assignment_change->>'network_id')::int = any(${sql.val(group.absorbed)}::int[])`)
      .executeTakeFirst();

    const reminders = await trx
      .updateTable('network_reminders')
      .set({ network_id: group.survivor })
      .where('network_type', '=', NETWORK_TYPE)
      .where('network_id', 'in', group.absorbed)
      .executeTakeFirst();

    const zdp = await trx
      .updateTable('zone_de_developpement_prioritaire')
      .set({
        reseau_en_construction_ids: sql<number[]>`COALESCE((
          SELECT array_agg(DISTINCT CASE WHEN elem = any(${sql.val(group.absorbed)}::int[]) THEN ${group.survivor}::int ELSE elem END)
          FROM unnest(reseau_en_construction_ids) AS elem
        ), ARRAY[]::int[])`,
      })
      .where(sql<boolean>`reseau_en_construction_ids && ${sql.val(group.absorbed)}::int[]`)
      .executeTakeFirst();

    // 3. Permissions : réassignation au survivant (idempotent) PUIS suppression des absorbés (scopé).
    const permsCreatedResult = await sql`
      INSERT INTO user_permissions (id, user_id, type, resource_id, created_at)
      SELECT gen_random_uuid(), up.user_id, ${NETWORK_TYPE}, ${String(group.survivor)}, now()
      FROM user_permissions up
      WHERE up.type = ${NETWORK_TYPE} AND up.resource_id = any(${sql.val(absorbedStr)}::text[])
      ON CONFLICT (user_id, type, resource_id) DO NOTHING
    `.execute(trx);

    const permsDeleted = await trx
      .deleteFrom('user_permissions')
      .where('type', '=', NETWORK_TYPE)
      .where('resource_id', 'in', absorbedStr)
      .executeTakeFirst();

    // 4. Suppression des lignes absorbées.
    await trx.deleteFrom('zones_et_reseaux_en_construction').where('id_fcu', 'in', group.absorbed).execute();

    return {
      demands: Number(demands.numUpdatedRows ?? 0),
      pending: Number(pending.numUpdatedRows ?? 0),
      permsCreated: Number(permsCreatedResult.numAffectedRows ?? 0),
      permsDeleted: Number(permsDeleted.numDeletedRows ?? 0),
      reminders: Number(reminders.numUpdatedRows ?? 0),
      zdp: Number(zdp.numUpdatedRows ?? 0),
    };
  });
}

/** Compte les écritures qui seraient faites (mode dry-run, aucune écriture). */
async function previewMerge(group: MergeGroup): Promise<RemapCounts> {
  const absorbedStr = group.absorbed.map(String);
  const count = (value: string | number | bigint): number => Number(value);

  const demands = await kdb
    .selectFrom('demands')
    .select((eb) => eb.fn.countAll().as('count'))
    .where('network_type', '=', NETWORK_TYPE)
    .where('network_id', 'in', group.absorbed)
    .executeTakeFirstOrThrow();

  const pending = await sql<{ count: string }>`
    SELECT count(*)::text AS count FROM demands
    WHERE pending_assignment_change->>'network_type' = ${NETWORK_TYPE}
      AND (pending_assignment_change->>'network_id')::int = any(${sql.val(group.absorbed)}::int[])
  `.execute(kdb);

  const reminders = await kdb
    .selectFrom('network_reminders')
    .select((eb) => eb.fn.countAll().as('count'))
    .where('network_type', '=', NETWORK_TYPE)
    .where('network_id', 'in', group.absorbed)
    .executeTakeFirstOrThrow();

  const zdp = await sql<{ count: string }>`
    SELECT count(*)::text AS count FROM zone_de_developpement_prioritaire
    WHERE reseau_en_construction_ids && ${sql.val(group.absorbed)}::int[]
  `.execute(kdb);

  const permsCreated = await sql<{ count: string }>`
    SELECT count(DISTINCT up.user_id)::text AS count FROM user_permissions up
    WHERE up.type = ${NETWORK_TYPE} AND up.resource_id = any(${sql.val(absorbedStr)}::text[])
      AND NOT EXISTS (
        SELECT 1 FROM user_permissions s
        WHERE s.user_id = up.user_id AND s.type = ${NETWORK_TYPE} AND s.resource_id = ${String(group.survivor)}
      )
  `.execute(kdb);

  const permsDeleted = await kdb
    .selectFrom('user_permissions')
    .select((eb) => eb.fn.countAll().as('count'))
    .where('type', '=', NETWORK_TYPE)
    .where('resource_id', 'in', absorbedStr)
    .executeTakeFirstOrThrow();

  return {
    demands: count(demands.count as string),
    pending: count(pending.rows[0].count),
    permsCreated: count(permsCreated.rows[0].count),
    permsDeleted: count(permsDeleted.count as string),
    reminders: count(reminders.count as string),
    zdp: count(zdp.rows[0].count),
  };
}

/** Récupère l'id de record Airtable correspondant à un id_fcu (null si absent). */
async function findAirtableRecordId(idFcu: number): Promise<string | null> {
  const records = await AirtableDB(AIRTABLE_TABLE)
    .select({ filterByFormula: `{id_fcu} = "${idFcu}"`, maxRecords: 1 })
    .firstPage();
  return records[0]?.id ?? null;
}

type AirtableResult = { survivorUpdated: boolean; absorbedDeleted: number; errors: string[] };

/**
 * Répercute la fusion sur Airtable (hors transaction PG, déjà commitée) :
 * MAJ du survivant (mise_en_service = fourchette, gestionnaire trim) + suppression des absorbés.
 * Best-effort : toute erreur est collectée et remontée sans interrompre la suite.
 */
async function applyAirtable(group: MergeGroup): Promise<AirtableResult> {
  const result: AirtableResult = { absorbedDeleted: 0, errors: [], survivorUpdated: false };

  try {
    const survivorRecordId = await findAirtableRecordId(group.survivor);
    if (survivorRecordId) {
      await AirtableDB(AIRTABLE_TABLE).update(
        survivorRecordId,
        { gestionnaire: group.survivorGestionnaire?.trim() ?? '', mise_en_service: group.fourchette ?? '' },
        { typecast: true }
      );
      result.survivorUpdated = true;
    } else {
      result.errors.push(`Airtable: survivant id_fcu ${group.survivor} introuvable (MAJ ignorée)`);
    }
  } catch (error) {
    result.errors.push(`Airtable: échec MAJ survivant ${group.survivor} — ${(error as Error).message}`);
  }

  for (const absorbedId of group.absorbed) {
    try {
      const recordId = await findAirtableRecordId(absorbedId);
      if (!recordId) {
        result.errors.push(`Airtable: absorbé id_fcu ${absorbedId} introuvable (déjà supprimé ?)`);
        continue;
      }
      await AirtableDB(AIRTABLE_TABLE).destroy(recordId);
      result.absorbedDeleted += 1;
    } catch (error) {
      result.errors.push(`Airtable: échec suppression absorbé ${absorbedId} — ${(error as Error).message}`);
    }
  }

  return result;
}

function geomLabel(dimension: GeomDimension): string {
  return dimension === 'polygon' ? 'zone' : 'tracé';
}

/** Écrit le log structuré NDJSON et retourne le chemin du fichier. */
function writeLog(records: object[], dryRun: boolean): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.resolve(process.cwd(), `merge-construction-${dryRun ? 'dryrun' : 'applied'}-${stamp}.ndjson`);
  writeFileSync(logPath, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
  return logPath;
}

export async function mergeConstructionNetworks(options: { dryRun: boolean }): Promise<void> {
  const { dryRun } = options;
  const { mergeable, conflicts } = await loadGroups();
  const candidates = await findProximityCandidates();
  // On masque les clusters déjà tranchés (fusion manuelle ou suivi en attente).
  const decidedIds = new Set([...MANUAL_MERGE_GROUPS, ...PENDING_REVIEW_GROUPS].flatMap((group) => group.ids));
  const openCandidates = candidates.filter((candidate) => !candidate.ids.every((id) => decidedIds.has(id)));

  const out: string[] = [];
  const logRecords: object[] = [];
  const startedAt = new Date().toISOString();
  const header = dryRun ? 'DRY-RUN (aucune modification)' : 'APPLIQUÉ';
  out.push('═'.repeat(72));
  out.push(` FUSION DES RÉSEAUX EN CONSTRUCTION — ${header}`);
  out.push('═'.repeat(72));

  const totalRows = mergeable.reduce((sum, group) => sum + group.allIds.length, 0);
  const absorbedIds = mergeable.flatMap((group) => group.absorbed).sort((a, b) => a - b);
  const manualCount = mergeable.filter((group) => group.origin === 'manual').length;

  logRecords.push({ absorbedIds, dryRun, groups: mergeable.length, kind: 'header', startedAt, totalRows });

  out.push('');
  out.push(`PART 1 — Fusions (nom identique + type homogène, et ${manualCount} fusion(s) manuelle(s) validée(s))`);
  out.push(`  ${mergeable.length} groupes · ${totalRows} lignes → ${mergeable.length} entités · ${absorbedIds.length} lignes absorbées`);
  out.push('');

  const totals: RemapCounts = { demands: 0, pending: 0, permsCreated: 0, permsDeleted: 0, reminders: 0, zdp: 0 };
  const airtableErrors: string[] = [];

  for (const group of mergeable) {
    const counts = dryRun ? await previewMerge(group) : await applyMerge(group);
    for (const key of Object.keys(totals) as (keyof RemapCounts)[]) totals[key] += counts[key];

    // Hors transaction : recalcul des infos dérivées de la géométrie + répercussion Airtable.
    let airtable: AirtableResult | null = null;
    if (!dryRun) {
      try {
        await updateEntityWithoutGeometry('zones_et_reseaux_en_construction', 'id_fcu', group.survivor);
      } catch (error) {
        airtableErrors.push(`refresh-infos survivant ${group.survivor} — ${(error as Error).message}`);
      }
      airtable = await applyAirtable(group);
      airtableErrors.push(...airtable.errors);
    }

    const originTag = group.origin === 'manual' ? ' · fusion manuelle' : '';
    out.push(`  • ${group.nomDisplay} [${geomLabel(group.dimension)}]${originTag}`);
    out.push(`      survivant ${group.survivor}  ←  absorbe ${group.absorbed.join(', ')}`);
    out.push(`      dates: ${group.dates.map((date) => date ?? '∅').join(' / ')}  →  fourchette « ${group.fourchette ?? '∅'} »`);
    out.push(`      notes: ${group.mergedNotes !== null ? 'concaténées sur le survivant' : 'inchangées'}`);
    out.push(
      `      demandes: ${counts.demands} · pending: ${counts.pending} · rappels: ${counts.reminders} · PDP: ${counts.zdp} · ` +
        `permissions +${counts.permsCreated}/-${counts.permsDeleted}`
    );
    if (airtable) {
      out.push(
        `      airtable: survivant ${airtable.survivorUpdated ? 'MAJ' : 'non MAJ'} · ${airtable.absorbedDeleted} absorbé(s) supprimé(s)`
      );
    }

    logRecords.push({
      absorbed: group.absorbed,
      airtable,
      counts,
      dimension: group.dimension,
      fourchette: group.fourchette,
      kind: 'merge-group',
      mode: dryRun ? 'dry-run' : 'applied',
      nomDisplay: group.nomDisplay,
      notesMerged: group.mergedNotes !== null,
      origin: group.origin,
      survivor: group.survivor,
    });
  }

  out.push('');
  out.push('TOTAUX');
  out.push(
    `  demandes: ${totals.demands} · pending: ${totals.pending} · rappels: ${totals.reminders} · PDP: ${totals.zdp} · ` +
      `permissions +${totals.permsCreated}/-${totals.permsDeleted}`
  );
  logRecords.push({ kind: 'totals', totals });

  if (conflicts.length > 0) {
    out.push('');
    out.push('⚠ CONFLITS DE TYPE — non fusionnés, revue manuelle requise');
    for (const conflict of conflicts) {
      const detail = conflict.items.map((item) => `${item.gtype} (id ${item.id_fcu})`).join(' + ');
      out.push(`  • ${conflict.nomDisplay} : ${detail} → impossible d'agréger une ligne et une zone`);
    }
  }

  if (openCandidates.length > 0) {
    out.push('');
    out.push('PART 2 — Candidats par proximité non tranchés (même gestionnaire, NON fusionnés)');
    for (const candidate of openCandidates) {
      out.push(`  • [${geomLabel(candidate.dimension)}] ${candidate.gestionnaire} — ids ${candidate.ids.join(', ')}`);
      out.push(`      ${candidate.noms.map((nom) => `« ${nom} »`).join(' / ')}`);
    }
  }

  if (PENDING_REVIEW_GROUPS.length > 0) {
    out.push('');
    out.push('EN ATTENTE DE DÉCISION (suivi — NON fusionnés)');
    for (const pending of PENDING_REVIEW_GROUPS) {
      out.push(`  • ${pending.label} — ids ${pending.ids.join(', ')} (${pending.reason})`);
    }
  }

  if (airtableErrors.length > 0) {
    out.push('');
    out.push(`⚠ AIRTABLE — ${airtableErrors.length} avertissement(s)/erreur(s) (à traiter à la main)`);
    for (const error of airtableErrors) out.push(`  • ${error}`);
    logRecords.push({ errors: airtableErrors, kind: 'airtable-errors' });
  }

  const logPath = writeLog(logRecords, dryRun);

  out.push('');
  out.push('─'.repeat(72));
  out.push(`Log détaillé : ${logPath}`);
  out.push('─'.repeat(72));
  out.push('');
  out.push('PROCHAINES ÉTAPES');
  if (dryRun) {
    out.push('  1. Vérifier ce rapport.');
    out.push('  2. Relancer avec --apply pour exécuter la fusion (base + Airtable, en une étape).');
    out.push('  3. Régénérer les tuiles : « pnpm cli tiles generate reseaux-en-construction ».');
  } else {
    out.push('  1. Fusion appliquée en base et répercutée sur Airtable.');
    out.push('  2. Régénérer les tuiles : « pnpm cli tiles generate reseaux-en-construction ».');
  }

  logger.info(`\n${out.join('\n')}`);
}
