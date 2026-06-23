import { TRPCError } from '@trpc/server';

import { createUserEvent } from '@/modules/events/server/service';
import { removeOrganizationPermissionFromAllUsers } from '@/modules/permissions/server/service';
import { kdb, sql } from '@/server/db/kysely';

import type { CreateOrganizationInput, UpdateOrganizationInput } from '../constants';
import type { CreatedCredential, Organization, OrganizationListItem, SafeCredential } from '../types';
import { generateApiToken, hashApiToken } from './credentials';

/** Tables réseau portant une colonne `organization_id`. */
export type NetworkTableName = 'reseaux_de_chaleur' | 'reseaux_de_froid' | 'zones_et_reseaux_en_construction';

/** Ligne de dérive motif↔réseau (réseau de chaleur + organisation concernée). */
export type NetworkPatternDriftRow = {
  id_fcu: number;
  nom_reseau: string | null;
  gestionnaire: string | null;
  organization_id: string;
  organization_name: string;
};

// ─── Organizations ────────────────────────────────────────────────────────────

export const listOrganizations = async (): Promise<OrganizationListItem[]> => {
  const [organizations, networkCounts, credentialCounts, driftCounts] = await Promise.all([
    kdb.selectFrom('organizations').select(['id', 'name', 'created_at', 'gestionnaire_patterns']).orderBy('name').execute(),
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select(['organization_id'])
      .select((eb) => eb.fn.countAll().as('count'))
      .where('organization_id', 'is not', null)
      .groupBy('organization_id')
      .execute(),
    kdb
      .selectFrom('organization_api_credentials')
      .select(['organization_id'])
      .select((eb) => eb.fn.countAll().as('count'))
      .where('revoked_at', 'is', null)
      .groupBy('organization_id')
      .execute(),
    // Dérive par org (motifs non vides) : réseaux non rattachés matchant un motif + réseaux rattachés hors motif.
    kdb
      .selectFrom('organizations as o')
      .innerJoin('reseaux_de_chaleur as r', (join) => join.onTrue())
      .select(['o.id as organization_id'])
      .select((eb) => eb.fn.countAll().as('count'))
      .where(
        sql<boolean>`cardinality(o.gestionnaire_patterns) > 0 and (
          (r.organization_id is null and r."Gestionnaire" ilike any(o.gestionnaire_patterns))
          or (r.organization_id = o.id and (r."Gestionnaire" is null or not (r."Gestionnaire" ilike any(o.gestionnaire_patterns))))
        )`
      )
      .groupBy('o.id')
      .execute(),
  ]);

  const toMap = (rows: { organization_id: string | null; count: string | number | bigint }[]) =>
    new Map(rows.map((r) => [r.organization_id, Number(r.count)]));
  const networksByOrg = toMap(networkCounts);
  const credentialsByOrg = toMap(credentialCounts);
  const driftByOrg = toMap(driftCounts);

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

/**
 * Réseaux de chaleur non rattachés dont le `Gestionnaire` matche un motif déclaré d'une org (ILIKE ANY).
 * Sans `organizationId` : toutes les orgs à motifs (diagnostic) ; avec : une seule org (dialog).
 */
export const findUnattachedNetworksMatchingPatterns = async (organizationId?: string): Promise<NetworkPatternDriftRow[]> => {
  let q = kdb
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
    .where(sql<boolean>`cardinality(o.gestionnaire_patterns) > 0 and r."Gestionnaire" ilike any(o.gestionnaire_patterns)`)
    .orderBy('o.name')
    .orderBy('r.nom_reseau');
  if (organizationId) {
    q = q.where('o.id', '=', organizationId);
  }
  return q.execute();
};

/** Réseaux rattachés à une org dont le `Gestionnaire` ne matche aucun de ses motifs (ou est nul). */
export const findAttachedNetworksNotMatchingPatterns = async (organizationId?: string): Promise<NetworkPatternDriftRow[]> => {
  let q = kdb
    .selectFrom('reseaux_de_chaleur as r')
    .innerJoin('organizations as o', 'o.id', 'r.organization_id')
    .select((eb) => [
      'r.id_fcu',
      'r.nom_reseau',
      eb.ref('r.Gestionnaire').as('gestionnaire'),
      'o.id as organization_id',
      'o.name as organization_name',
    ])
    .where(sql<boolean>`cardinality(o.gestionnaire_patterns) > 0`)
    .where(sql<boolean>`(r."Gestionnaire" is null or not (r."Gestionnaire" ilike any(o.gestionnaire_patterns)))`)
    .orderBy('o.name')
    .orderBy('r.nom_reseau');
  if (organizationId) {
    q = q.where('o.id', '=', organizationId);
  }
  return q.execute();
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

/** Refresh attach-only : rattache les réseaux non rattachés matchant les motifs de l'org. Retourne le nombre rattaché. */
export const refreshOrganizationNetworks = async (organizationId: string): Promise<number> => {
  const res = await kdb
    .updateTable('reseaux_de_chaleur')
    .set({ organization_id: organizationId })
    .where('organization_id', 'is', null)
    .where(sql<boolean>`"Gestionnaire" ilike any (select unnest(gestionnaire_patterns) from organizations where id = ${organizationId})`)
    .executeTakeFirst();
  return Number(res?.numUpdatedRows ?? 0);
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

export const listOrganizationChaleurNetworks = async (organizationId: string) =>
  kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu', 'nom_reseau', 'Gestionnaire'])
    .where('organization_id', '=', organizationId)
    .orderBy('nom_reseau')
    .execute();

/** Compte les réseaux de chaleur dont le Gestionnaire matche un motif ILIKE (aperçu avant rattachement). */
export const countChaleurNetworksByPattern = async (pattern: string): Promise<number> => {
  const row = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select((eb) => eb.fn.countAll().as('count'))
    .where('Gestionnaire', 'ilike', pattern)
    .executeTakeFirstOrThrow();
  return Number(row.count);
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
