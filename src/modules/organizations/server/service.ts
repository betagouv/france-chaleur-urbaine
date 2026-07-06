import { TRPCError } from '@trpc/server';

import { createUserEvent } from '@/modules/events/server/service';
import { removeOrganizationPermissionFromAllUsers } from '@/modules/permissions/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';

import type { CreateOrganizationInput, UpdateOrganizationInput } from '../constants';
import type { CreatedCredential, Organization, OrganizationListItem, SafeCredential } from '../types';
import { generateApiToken, hashApiToken } from './credentials';

/** Tables réseau portant une colonne `organization_id`. */
export type NetworkTableName = 'reseaux_de_chaleur' | 'reseaux_de_froid' | 'zones_et_reseaux_en_construction';

/** Ligne de dérive motif↔réseau (chaleur ou construction + organisation concernée). */
export type NetworkPatternDriftRow = {
  id_fcu: number;
  type: NetworkType;
  nom_reseau: string | null;
  gestionnaire: string | null;
  organization_id: string;
  organization_name: string;
};

// ─── Organizations ────────────────────────────────────────────────────────────

export const listOrganizations = async (): Promise<OrganizationListItem[]> => {
  const networkCountByOrg = (table: 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction') =>
    kdb
      .selectFrom(table)
      .select(['organization_id'])
      .select((eb) => eb.fn.countAll().as('count'))
      .where('organization_id', 'is not', null)
      .groupBy('organization_id')
      .execute();

  // Dérive (chaleur + construction) réutilisée telle quelle : réseaux non rattachés matchant un motif + rattachés hors motif.
  const [organizations, chaleurCounts, constructionCounts, credentialCounts, unattachedDrift, attachedDrift] = await Promise.all([
    kdb.selectFrom('organizations').select(['id', 'name', 'created_at', 'gestionnaire_patterns']).orderBy('name').execute(),
    networkCountByOrg('reseaux_de_chaleur'),
    networkCountByOrg('zones_et_reseaux_en_construction'),
    kdb
      .selectFrom('organization_api_credentials')
      .select(['organization_id'])
      .select((eb) => eb.fn.countAll().as('count'))
      .where('revoked_at', 'is', null)
      .groupBy('organization_id')
      .execute(),
    findUnattachedNetworksMatchingPatterns(),
    findAttachedNetworksNotMatchingPatterns(),
  ]);

  const credentialsByOrg = new Map(credentialCounts.map((row) => [row.organization_id, Number(row.count)]));

  // networks_count et dérive agrègent les deux types de réseaux (chaleur + construction).
  const networksByOrg = new Map<string | null, number>();
  [...chaleurCounts, ...constructionCounts].forEach((row) =>
    networksByOrg.set(row.organization_id, (networksByOrg.get(row.organization_id) ?? 0) + Number(row.count))
  );

  const driftByOrg = new Map<string, number>();
  [...unattachedDrift, ...attachedDrift].forEach((row) =>
    driftByOrg.set(row.organization_id, (driftByOrg.get(row.organization_id) ?? 0) + 1)
  );

  return organizations.map((o) => ({
    ...o,
    credentials_count: credentialsByOrg.get(o.id) ?? 0,
    drifting_networks_count: driftByOrg.get(o.id) ?? 0,
    networks_count: networksByOrg.get(o.id) ?? 0,
  }));
};

export const getOrganization = async (id: string): Promise<Organization> =>
  kdb
    .selectFrom('organizations')
    .select(['id', 'name', 'created_at', 'gestionnaire_patterns'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Organisation introuvable' }));

// Le nom dupliqué (index unique `idx_organizations_name`) est traduit globalement par le middleware tRPC `db-errors`.
export const createOrganization = async (input: CreateOrganizationInput, authorId: string): Promise<Organization> => {
  const org = await kdb
    .insertInto('organizations')
    .values({ name: input.name })
    .returning(['id', 'name', 'created_at', 'gestionnaire_patterns'])
    .executeTakeFirstOrThrow();
  await createUserEvent({
    author_id: authorId,
    context_id: org.id,
    context_type: 'organization',
    data: { name: org.name, organization_id: org.id },
    type: 'organization_created',
  });
  return org;
};

export const updateOrganization = async (id: string, input: UpdateOrganizationInput, authorId: string): Promise<Organization> => {
  const org = await kdb
    .updateTable('organizations')
    .set({ name: input.name })
    .where('id', '=', id)
    .returning(['id', 'name', 'created_at', 'gestionnaire_patterns'])
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Organisation introuvable' }));
  await createUserEvent({
    author_id: authorId,
    context_id: org.id,
    context_type: 'organization',
    data: { name: org.name, organization_id: org.id },
    type: 'organization_updated',
  });
  return org;
};

export const deleteOrganization = async (id: string, authorId: string): Promise<void> => {
  const org = await kdb.selectFrom('organizations').select('name').where('id', '=', id).executeTakeFirst();
  // Les permissions `organization` n'ont pas de FK vers `organizations` → on les retire d'abord,
  // sinon elles deviennent orphelines (pointant un id mort). Voir removeOrganizationPermissionFromAllUsers.
  await removeOrganizationPermissionFromAllUsers(id, authorId);
  // FK : credentials supprimés en cascade ; réseaux et users dé-rattachés (ON DELETE SET NULL).
  await kdb.deleteFrom('organizations').where('id', '=', id).execute();
  await createUserEvent({
    author_id: authorId,
    context_id: id,
    context_type: 'organization',
    data: { name: org?.name ?? '', organization_id: id },
    type: 'organization_deleted',
  });
};

// ─── Networks (organization_id sur les ressources réseau) ───────────────────────

/** Affecte (ou dé-affecte si `organizationId` est null) des réseaux par `id_fcu`. Retourne le nombre de lignes modifiées. */
export const assignNetworks = async (table: NetworkTableName, idsFcu: number[], organizationId: string | null): Promise<number> => {
  if (idsFcu.length === 0) return 0;
  const res = await kdb.updateTable(table).set({ organization_id: organizationId }).where('id_fcu', 'in', idsFcu).executeTakeFirst();
  return Number(res?.numUpdatedRows ?? 0);
};

/** Ordonne les lignes de dérive par organisation puis par nom de réseau (tri applicatif, union de 2 tables). */
const sortDriftRows = (rows: NetworkPatternDriftRow[]): NetworkPatternDriftRow[] =>
  rows.sort(
    (left, right) =>
      left.organization_name.localeCompare(right.organization_name) || (left.nom_reseau ?? '').localeCompare(right.nom_reseau ?? '')
  );

/**
 * Réseaux (chaleur + construction) non rattachés dont le gestionnaire matche un motif déclaré d'une org (ILIKE ANY).
 * Sans `organizationId` : toutes les orgs à motifs (diagnostic) ; avec : une seule org (dialog).
 */
export const findUnattachedNetworksMatchingPatterns = async (organizationId?: string): Promise<NetworkPatternDriftRow[]> => {
  const chaleur = kdb
    .selectFrom('reseaux_de_chaleur as r')
    .innerJoin('organizations as o', (join) => join.onTrue())
    .select((eb) => [
      'r.id_fcu',
      'r.nom_reseau',
      eb.ref('r.Gestionnaire').as('gestionnaire'),
      'o.id as organization_id',
      'o.name as organization_name',
    ])
    .where('r.organization_id', 'is', null)
    .where(
      (eb) =>
        sql<boolean>`cardinality(${eb.ref('o.gestionnaire_patterns')}) > 0 and ${eb.ref('r.Gestionnaire')} ilike any(${eb.ref('o.gestionnaire_patterns')})`
    );
  const construction = kdb
    .selectFrom('zones_et_reseaux_en_construction as r')
    .innerJoin('organizations as o', (join) => join.onTrue())
    .select(['r.id_fcu', 'r.nom_reseau', 'r.gestionnaire', 'o.id as organization_id', 'o.name as organization_name'])
    .where('r.organization_id', 'is', null)
    .where(
      (eb) =>
        sql<boolean>`cardinality(${eb.ref('o.gestionnaire_patterns')}) > 0 and ${eb.ref('r.gestionnaire')} ilike any(${eb.ref('o.gestionnaire_patterns')})`
    );
  const [chaleurRows, constructionRows] = await Promise.all([
    (organizationId ? chaleur.where('o.id', '=', organizationId) : chaleur).execute(),
    (organizationId ? construction.where('o.id', '=', organizationId) : construction).execute(),
  ]);
  return sortDriftRows([
    ...chaleurRows.map((row) => ({ ...row, type: 'reseau_de_chaleur' as const })),
    ...constructionRows.map((row) => ({ ...row, type: 'reseau_en_construction' as const })),
  ]);
};

/** Réseaux (chaleur + construction) rattachés à une org dont le gestionnaire ne matche aucun de ses motifs (ou est nul). */
export const findAttachedNetworksNotMatchingPatterns = async (organizationId?: string): Promise<NetworkPatternDriftRow[]> => {
  const chaleur = kdb
    .selectFrom('reseaux_de_chaleur as r')
    .innerJoin('organizations as o', 'o.id', 'r.organization_id')
    .select((eb) => [
      'r.id_fcu',
      'r.nom_reseau',
      eb.ref('r.Gestionnaire').as('gestionnaire'),
      'o.id as organization_id',
      'o.name as organization_name',
    ])
    .where((eb) => sql<boolean>`cardinality(${eb.ref('o.gestionnaire_patterns')}) > 0`)
    .where(
      (eb) =>
        sql<boolean>`(${eb.ref('r.Gestionnaire')} is null or not (${eb.ref('r.Gestionnaire')} ilike any(${eb.ref('o.gestionnaire_patterns')})))`
    );
  const construction = kdb
    .selectFrom('zones_et_reseaux_en_construction as r')
    .innerJoin('organizations as o', 'o.id', 'r.organization_id')
    .select(['r.id_fcu', 'r.nom_reseau', 'r.gestionnaire', 'o.id as organization_id', 'o.name as organization_name'])
    .where((eb) => sql<boolean>`cardinality(${eb.ref('o.gestionnaire_patterns')}) > 0`)
    .where(
      (eb) =>
        sql<boolean>`(${eb.ref('r.gestionnaire')} is null or not (${eb.ref('r.gestionnaire')} ilike any(${eb.ref('o.gestionnaire_patterns')})))`
    );
  const [chaleurRows, constructionRows] = await Promise.all([
    (organizationId ? chaleur.where('o.id', '=', organizationId) : chaleur).execute(),
    (organizationId ? construction.where('o.id', '=', organizationId) : construction).execute(),
  ]);
  return sortDriftRows([
    ...chaleurRows.map((row) => ({ ...row, type: 'reseau_de_chaleur' as const })),
    ...constructionRows.map((row) => ({ ...row, type: 'reseau_en_construction' as const })),
  ]);
};

/** Déclare les motifs `Gestionnaire` d'une org (nettoyés/dédupliqués). Émet un event `organization_updated`. */
export const setOrganizationPatterns = async (organizationId: string, patterns: string[], authorId: string): Promise<void> => {
  const cleaned = [...new Set(patterns.map((p) => p.trim()).filter((p) => p.length >= 2))];
  const org = await kdb
    .updateTable('organizations')
    .set({ gestionnaire_patterns: cleaned })
    .where('id', '=', organizationId)
    .returning(['id', 'name'])
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Organisation introuvable' }));
  await createUserEvent({
    author_id: authorId,
    context_id: org.id,
    context_type: 'organization',
    data: { name: org.name, organization_id: org.id },
    type: 'organization_updated',
  });
};

/**
 * Refresh attach-only : rattache les réseaux (chaleur + construction) non rattachés matchant les motifs de l'org.
 * Retourne le nombre total rattaché.
 */
export const refreshOrganizationNetworks = async (organizationId: string): Promise<number> => {
  const org = await kdb.selectFrom('organizations').select('gestionnaire_patterns').where('id', '=', organizationId).executeTakeFirst();
  const patterns = org?.gestionnaire_patterns ?? [];
  if (patterns.length === 0) {
    return 0;
  }
  const [chaleur, construction] = await Promise.all([
    kdb
      .updateTable('reseaux_de_chaleur')
      .set({ organization_id: organizationId })
      .where('organization_id', 'is', null)
      .where((eb) => sql<boolean>`${eb.ref('Gestionnaire')} ilike any(${patterns}::text[])`)
      .executeTakeFirst(),
    kdb
      .updateTable('zones_et_reseaux_en_construction')
      .set({ organization_id: organizationId })
      .where('organization_id', 'is', null)
      .where((eb) => sql<boolean>`${eb.ref('gestionnaire')} ilike any(${patterns}::text[])`)
      .executeTakeFirst(),
  ]);
  return Number(chaleur?.numUpdatedRows ?? 0) + Number(construction?.numUpdatedRows ?? 0);
};

/** Motifs déclarés + compteurs de dérive (à rattacher / rattachés hors motif) pour le dialog. */
export const getOrganizationNetworkDrift = async (
  organizationId: string
): Promise<{ patterns: string[]; unattachedCount: number; attachedUnmatchedCount: number }> => {
  const [org, unattached, attachedUnmatched] = await Promise.all([
    kdb
      .selectFrom('organizations')
      .select('gestionnaire_patterns')
      .where('id', '=', organizationId)
      .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Organisation introuvable' })),
    findUnattachedNetworksMatchingPatterns(organizationId),
    findAttachedNetworksNotMatchingPatterns(organizationId),
  ]);
  return { attachedUnmatchedCount: attachedUnmatched.length, patterns: org.gestionnaire_patterns, unattachedCount: unattached.length };
};

// ─── API credentials ───────────────────────────────────────────────────────────

export const listCredentials = async (organizationId: string): Promise<SafeCredential[]> =>
  kdb
    .selectFrom('organization_api_credentials')
    .select(['id', 'organization_id', 'name', 'last_used_at', 'revoked_at', 'created_at'])
    .where('organization_id', '=', organizationId)
    .orderBy('created_at', 'desc')
    .execute();

export const createCredential = async (organizationId: string, name: string | null): Promise<CreatedCredential> => {
  const token = generateApiToken();
  const row = await kdb
    .insertInto('organization_api_credentials')
    .values({ name, organization_id: organizationId, token_hash: hashApiToken(token) })
    .returning(['id', 'name'])
    .executeTakeFirstOrThrow();
  return { id: row.id, name: row.name, token };
};

export const revokeCredential = async (id: string): Promise<void> => {
  await kdb
    .updateTable('organization_api_credentials')
    .set({ revoked_at: new Date() })
    .where('id', '=', id)
    .where('revoked_at', 'is', null)
    .execute();
};

// ─── Networks listing & curation (UI) ──────────────────────────────────────────

/** Réseaux (chaleur + en construction) rattachés à une organisation, avec leur type — pour la curation UI. */
export const listOrganizationNetworks = async (organizationId: string) => {
  const [chaleur, construction] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select(['id_fcu', 'nom_reseau', 'Gestionnaire as gestionnaire'])
      .where('organization_id', '=', organizationId)
      .execute(),
    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select(['id_fcu', 'nom_reseau', 'gestionnaire'])
      .where('organization_id', '=', organizationId)
      .execute(),
  ]);
  return [
    ...chaleur.map((network) => ({ ...network, type: 'reseau_de_chaleur' as const })),
    ...construction.map((network) => ({ ...network, type: 'reseau_en_construction' as const })),
  ].sort((left, right) => (left.nom_reseau ?? '').localeCompare(right.nom_reseau ?? ''));
};

/** Compte les réseaux (chaleur + construction) dont le gestionnaire matche un motif ILIKE (aperçu avant rattachement). */
/**
 * Preview d'un motif : `total` = réseaux qui matchent le motif ; `attachable` = ceux réellement rattachables
 * (non rattachés). Les deux diffèrent car les réseaux déjà rattachés (à cette org ou une autre) ne sont pas re-pris.
 */
export const countNetworksByPattern = async (pattern: string): Promise<{ total: number; attachable: number }> => {
  const [chaleur, construction] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select((eb) => [eb.fn.countAll().as('total'), sql<number>`count(*) filter (where organization_id is null)`.as('attachable')])
      .where('Gestionnaire', 'ilike', pattern)
      .executeTakeFirstOrThrow(),
    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select((eb) => [eb.fn.countAll().as('total'), sql<number>`count(*) filter (where organization_id is null)`.as('attachable')])
      .where('gestionnaire', 'ilike', pattern)
      .executeTakeFirstOrThrow(),
  ]);
  return {
    attachable: Number(chaleur.attachable) + Number(construction.attachable),
    total: Number(chaleur.total) + Number(construction.total),
  };
};

/** Détache TOUS les réseaux (chaleur + construction) rattachés à une organisation. Retourne le nombre détaché. */
export const detachAllOrganizationNetworks = async (organizationId: string): Promise<number> => {
  const [chaleur, construction] = await Promise.all([
    kdb.updateTable('reseaux_de_chaleur').set({ organization_id: null }).where('organization_id', '=', organizationId).executeTakeFirst(),
    kdb
      .updateTable('zones_et_reseaux_en_construction')
      .set({ organization_id: null })
      .where('organization_id', '=', organizationId)
      .executeTakeFirst(),
  ]);
  return Number(chaleur?.numUpdatedRows ?? 0) + Number(construction?.numUpdatedRows ?? 0);
};

/**
 * Résout un token API en organisation (lookup par hash, credential non révoqué).
 * Base de l'authentification de l'API partenaire (Phase 3).
 */
export const findOrganizationByToken = async (token: string) => {
  const row = await kdb
    .selectFrom('organization_api_credentials as c')
    .innerJoin('organizations as o', 'o.id', 'c.organization_id')
    .select(['c.id as credential_id', 'o.id as organization_id', 'o.name as organization_name'])
    .where('c.token_hash', '=', hashApiToken(token))
    .where('c.revoked_at', 'is', null)
    .executeTakeFirst();
  return row ?? null;
};

/**
 * Marque un credential comme utilisé. Throttlé à 1 écriture/minute pour ne pas générer un UPDATE
 * à chaque requête de polling de l'API partenaire.
 */
export const touchCredentialLastUsed = async (credentialId: string): Promise<void> => {
  await kdb
    .updateTable('organization_api_credentials')
    .set({ last_used_at: new Date() })
    .where('id', '=', credentialId)
    .where((eb) => eb.or([eb('last_used_at', 'is', null), eb('last_used_at', '<', sql<Date>`now() - interval '1 minute'`)]))
    .execute();
};
