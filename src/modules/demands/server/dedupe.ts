import { writeFile } from 'node:fs/promises';

import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { removeDemand } from './admin-operations';

const logger = parentLogger.child({ module: 'demands/dedupe' });

/** Statut d'une demande non traitée. Toute autre valeur = demande traitée. */
const UNTREATED_STATUS: string = DEMANDE_STATUS.TO_PROCESS;

/** Membre d'un groupe de doublons : champs strictement nécessaires à la décision. */
export type DedupeCandidate = {
  id: string;
  status: string;
  created_at: Date;
};

/**
 * Cas de suppression (règle appliquée) :
 * - `aucune_traitee` : aucune demande traitée dans le groupe → on conserve la plus récente ;
 * - `non_traitee_vs_traitee` : demande non traitée supprimée car une demande traitée existe ;
 * - `meme_statut` : demande traitée supprimée au profit de la plus récente de même statut.
 */
export type DedupeReason = 'aucune_traitee' | 'non_traitee_vs_traitee' | 'meme_statut';

/** Libellés lisibles des cas, pour le rapport CSV. */
export const dedupeReasonLabels: Record<DedupeReason, string> = {
  aucune_traitee: 'Aucune traitée — conserve la plus récente',
  meme_statut: 'Même statut — conserve la plus récente',
  non_traitee_vs_traitee: 'Non traitée supprimée (une demande traitée existe)',
};

/** Une suppression décidée : la demande supprimée, la demande conservée dont elle est le doublon, et le cas. */
export type DedupeDeletion = {
  deletedId: string;
  keptId: string;
  reason: DedupeReason;
};

/**
 * Décide, pour un groupe de demandes partageant le même (email, adresse), lesquelles supprimer.
 *
 * Règles (une demande est « traitée » si son statut ≠ 'À traiter') :
 * - aucune traitée : garder la plus récente, supprimer les autres ;
 * - au moins une traitée : supprimer toutes les non-traitées, puis parmi les traitées,
 *   regrouper par statut et ne garder que la plus récente de chaque statut ;
 * - statuts traités tous distincts : rien à supprimer côté traitées.
 *
 * `keptId` d'une suppression = la demande conservée dont elle est le doublon :
 * - collapse même statut → la plus récente de ce statut ;
 * - non-traitée supprimée car une traitée existe → la traitée la plus récente ;
 * - groupe tout-non-traité → la plus récente.
 */
export const pickDeletions = (group: DedupeCandidate[]): DedupeDeletion[] => {
  if (group.length < 2) return [];

  // Tri décroissant par date : sorted[0] est toujours la plus récente.
  const sorted = [...group].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

  const treated = sorted.filter((demand) => demand.status !== UNTREATED_STATUS);
  const untreated = sorted.filter((demand) => demand.status === UNTREATED_STATUS);

  // Aucune traitée : garder la plus récente, supprimer le reste.
  if (treated.length === 0) {
    const [kept, ...rest] = sorted;
    return rest.map((demand) => ({ deletedId: demand.id, keptId: kept.id, reason: 'aucune_traitee' }));
  }

  const deletions: DedupeDeletion[] = [];

  // Les non-traitées sont supprimées ; leur survivante canonique est la traitée la plus récente.
  const canonicalTreated = treated[0];
  for (const demand of untreated) {
    deletions.push({ deletedId: demand.id, keptId: canonicalTreated.id, reason: 'non_traitee_vs_traitee' });
  }

  // Parmi les traitées : garder la plus récente par statut (première vue, tri desc), supprimer les autres.
  const keptByStatus = new Map<string, DedupeCandidate>();
  for (const demand of treated) {
    const kept = keptByStatus.get(demand.status);
    if (kept) {
      deletions.push({ deletedId: demand.id, keptId: kept.id, reason: 'meme_statut' });
    } else {
      keptByStatus.set(demand.status, demand);
    }
  }

  return deletions;
};

type LoadedDemand = DedupeCandidate & {
  email: string;
  adresse: string;
};

/** Normalise une valeur pour la comparaison : minuscules, trim, espaces multiples réduits. */
const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Charge les demandes actives dédoublonnables (email + adresse renseignés), normalisées. */
const loadCandidates = async (): Promise<LoadedDemand[]> => {
  const rows = await kdb.selectFrom('demands').select(['id', 'created_at', 'legacy_values']).where('deleted_at', 'is', null).execute();

  return rows.reduce<LoadedDemand[]>((acc, row) => {
    const email = normalize(row.legacy_values.Mail ?? '');
    const adresse = normalize(row.legacy_values.Adresse ?? '');
    if (email === '' || adresse === '') return acc;

    acc.push({
      adresse,
      created_at: new Date(row.created_at),
      email,
      id: row.id,
      status: row.legacy_values.Status || UNTREATED_STATUS,
    });
    return acc;
  }, []);
};

/** Une ligne du rapport : la demande supprimée, la demande conservée et le cas appliqué. */
export type DedupeReportRow = {
  email: string;
  adresse: string;
  reason: DedupeReason;
  deletedId: string;
  deletedStatus: string;
  deletedCreatedAt: Date;
  keptId: string;
  keptStatus: string;
  keptCreatedAt: Date;
};

export type DedupePlan = {
  totalCandidates: number;
  duplicateGroups: number;
  deletions: DedupeReportRow[];
};

/** Construit le plan de dédoublonnage complet à partir du stock, sans rien modifier. */
export const buildDedupePlan = async (): Promise<DedupePlan> => {
  const candidates = await loadCandidates();
  const byId = new Map(candidates.map((demand) => [demand.id, demand]));

  const groups = new Map<string, LoadedDemand[]>();
  for (const demand of candidates) {
    const key = `${demand.email} ${demand.adresse}`;
    const group = groups.get(key);
    if (group) {
      group.push(demand);
    } else {
      groups.set(key, [demand]);
    }
  }

  let duplicateGroups = 0;
  const deletions: DedupeReportRow[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const groupDeletions = pickDeletions(members);
    if (groupDeletions.length === 0) continue;

    duplicateGroups++;
    for (const deletion of groupDeletions) {
      const deleted = byId.get(deletion.deletedId);
      const kept = byId.get(deletion.keptId);
      if (!deleted || !kept) continue; // garde-fou : impossible, les ids proviennent du groupe

      deletions.push({
        adresse: deleted.adresse,
        deletedCreatedAt: deleted.created_at,
        deletedId: deleted.id,
        deletedStatus: deleted.status,
        email: deleted.email,
        keptCreatedAt: kept.created_at,
        keptId: kept.id,
        keptStatus: kept.status,
        reason: deletion.reason,
      });
    }
  }

  return { deletions, duplicateGroups, totalCandidates: candidates.length };
};

const csvEscape = (value: string): string => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

const buildCsv = (rows: DedupeReportRow[]): string => {
  const header = [
    'cas',
    'email',
    'adresse',
    'deleted_id',
    'deleted_status',
    'deleted_created_at',
    'kept_id',
    'kept_status',
    'kept_created_at',
  ];
  const lines = rows.map((row) =>
    [
      dedupeReasonLabels[row.reason],
      row.email,
      row.adresse,
      row.deletedId,
      row.deletedStatus,
      row.deletedCreatedAt.toISOString(),
      row.keptId,
      row.keptStatus,
      row.keptCreatedAt.toISOString(),
    ]
      .map((value) => csvEscape(String(value)))
      .join(',')
  );
  return `${[header.join(','), ...lines].join('\n')}\n`;
};

/**
 * Dédoublonne le stock de demandes. Écrit toujours le rapport CSV.
 * En dry-run (défaut), ne touche pas à la base ; avec `apply`, soft-delete chaque doublon via `removeDemand`.
 */
export const dedupeDemands = async (options: { apply: boolean; out: string }): Promise<DedupePlan> => {
  const plan = await buildDedupePlan();

  logger.info('plan de dédoublonnage', {
    apply: options.apply,
    duplicateGroups: plan.duplicateGroups,
    plannedDeletions: plan.deletions.length,
    totalCandidates: plan.totalCandidates,
  });

  await writeFile(options.out, buildCsv(plan.deletions), 'utf8');
  logger.info(`Rapport CSV écrit : ${options.out} (${plan.deletions.length} suppressions prévues)`);

  if (!options.apply) {
    logger.warn('Mode dry-run : aucune modification en base. Relancez avec --apply pour exécuter.');
    return plan;
  }

  let done = 0;
  for (const row of plan.deletions) {
    await removeDemand(row.deletedId, undefined, {
      eventData: { kept_demand_id: row.keptId, reason: 'duplicate' },
    });
    done++;
    if (done % 100 === 0) logger.info(`${done}/${plan.deletions.length} demandes supprimées`);
  }
  logger.info(`Dédoublonnage terminé : ${done} demandes soft-deleted`);

  return plan;
};
