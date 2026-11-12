import { type Expression, type Selectable, type SelectQueryBuilder, type SqlBool, sql } from 'kysely';

import type { DB, Demands } from '@/server/db/kysely';
import { kdb } from '@/server/db/kysely';
import { type UserRole, userRolesWithPermissionsHeatNetwork, userRolesWithPermissionsRenewableHeat } from '@/types/enum/UserRole';

import {
  customTerritoryPermissionType,
  type NetworkPermission,
  type Permission,
  type TerritoryPermissionType,
  territoryPermissionToColumn,
} from '../types';
import { isCustomTerritoryPermissionType, isHeatNetworkDemandRole, isNetworkPermissionType, isOrganizationPermissionType } from './helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserWithRole = {
  id: string;
  role: UserRole;
};

export type DemandForAccess = Pick<
  Selectable<Demands>,
  | 'network_id'
  | 'network_type'
  | 'validated'
  | 'commune_code'
  | 'epci_code'
  | 'ept_code'
  | 'departement_code'
  | 'region_code'
  | 'custom_territory_ids'
> & {
  /** `organization_id` du réseau affecté (dérivé par jointure, esprit Piste 1). Null si pas de réseau ou réseau sans org. */
  network_organization_id: string | null;
};

// ─── Custom territory SQL predicates ─────────────────────────────────────────

/**
 * `demands.custom_territory_ids @> ARRAY[id]::uuid[]` — the id comes from a validated permission, so the uuid
 * cast is safe and the GIN index is used. For a permission column of mixed types use `permissionMatchesCustomTerritoryIds`.
 */
export const customTerritoryIdsContain = (idsColumn: Expression<string[]>, customTerritoryId: string) =>
  sql<SqlBool>`${idsColumn} @> ARRAY[${customTerritoryId}]::uuid[]`;

/**
 * `up.resource_id = ANY(d.custom_territory_ids::text[])` for joins on `user_permissions`. The cast is on the array
 * side on purpose: casting `resource_id` to uuid would fail on the other permission types of the same OR
 * (Postgres does not short-circuit `AND`).
 */
export const permissionMatchesCustomTerritoryIds = (resourceIdColumn: Expression<string | null>, idsColumn: Expression<string[]>) =>
  sql<SqlBool>`${resourceIdColumn} = ANY(${idsColumn}::text[])`;

// ─── Access filters (Kysely query builders) ──────────────────────────────────

/**
 * Builds a Kysely WHERE filter for demands accessible by a given user.
 * Executes in DB with indexes — no JS-side filtering.
 * Generic over the concrete builder so queries with extra joined tables
 * (e.g. `baseDemandQuery`) keep their own type through the filter.
 */
export const buildDemandAccessFilter = (
  user: UserWithRole,
  permissions: Permission[]
): (<QB extends SelectQueryBuilder<any, 'demands', any>>(qb: QB) => QB) => {
  const applyFilter = <O>(qb: SelectQueryBuilder<DB, 'demands', O>): SelectQueryBuilder<DB, 'demands', O> => {
    if (user.role === 'admin') {
      return qb;
    }

    if (!isHeatNetworkDemandRole(user.role)) {
      return qb.where(sql.lit(false));
    }

    qb = qb.where('demands.validated', '=', true);

    if (permissions.length === 0) {
      return qb.where(sql.lit(false));
    }

    // Partition à 4 : réseau / organisation / territoire personnalisé / territoire. Sans bucket dédié, une perm `organization`
    // tomberait dans `territoryPerms` et serait silencieusement ignorée (cf. garde-fou plan §6.1).
    const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));
    const organizationPerms = permissions.filter((p) => isOrganizationPermissionType(p.type));
    const customTerritoryPerms = permissions.filter((p) => isCustomTerritoryPermissionType(p.type));
    const territoryPerms = permissions.filter(
      (p) => !isNetworkPermissionType(p.type) && !isOrganizationPermissionType(p.type) && !isCustomTerritoryPermissionType(p.type)
    );

    return qb.where((eb) => {
      const conditions: Expression<SqlBool>[] = [];

      for (const p of networkPerms) {
        conditions.push(eb.and([eb('demands.network_id', '=', Number(p.resource_id)), eb('demands.network_type', '=', p.type)]));
      }

      // Org scope : la demande est affectée à un réseau (chaleur ou en construction) rattaché à l'organisation.
      for (const p of organizationPerms) {
        conditions.push(
          eb.or([
            eb.and([
              eb('demands.network_type', '=', 'reseau_de_chaleur'),
              eb(
                'demands.network_id',
                'in',
                eb.selectFrom('reseaux_de_chaleur').select('id_fcu').where('organization_id', '=', p.resource_id)
              ),
            ]),
            eb.and([
              eb('demands.network_type', '=', 'reseau_en_construction'),
              eb(
                'demands.network_id',
                'in',
                eb.selectFrom('zones_et_reseaux_en_construction').select('id_fcu').where('organization_id', '=', p.resource_id)
              ),
            ]),
          ])
        );
      }

      for (const p of territoryPerms) {
        if (p.type in territoryPermissionToColumn) {
          const column = territoryPermissionToColumn[p.type as keyof typeof territoryPermissionToColumn];
          conditions.push(eb(`demands.${column}` as any, '=', p.resource_id));
        }
      }

      for (const p of customTerritoryPerms) {
        conditions.push(customTerritoryIdsContain(eb.ref('demands.custom_territory_ids'), p.resource_id));
      }

      return conditions.length > 0 ? eb.or(conditions) : sql.lit(false);
    });
  };
  return (qb) => applyFilter(qb as SelectQueryBuilder<DB, 'demands', any>) as typeof qb;
};

// ─── Permission matchers (in-memory) ─────────────────────────────────────────

const isAffectedToNetwork = (demand: DemandForAccess): boolean => demand.network_id !== null && demand.network_type !== null;

/** Une perm réseau matche ssi elle cible le réseau exact auquel la demande est affectée. */
const matchesNetworkAffectation =
  (demand: DemandForAccess) =>
  (p: Permission): boolean =>
    isNetworkPermissionType(p.type) && p.type === demand.network_type && Number(p.resource_id) === demand.network_id;

/** Une perm territoire personnalisé matche ssi la commune de la demande appartient au territoire (ids dénormalisés). */
const matchesCustomTerritory =
  (demand: DemandForAccess) =>
  (p: Permission): boolean =>
    isCustomTerritoryPermissionType(p.type) && demand.custom_territory_ids.includes(p.resource_id);

/** Une perm territoire (administratif ou personnalisé) matche ssi elle couvre la maille géographique de la demande. */
const matchesTerritory =
  (demand: DemandForAccess) =>
  (p: Permission): boolean => {
    if (p.type in territoryPermissionToColumn) {
      const column = territoryPermissionToColumn[p.type as keyof typeof territoryPermissionToColumn];
      return demand[column] === p.resource_id;
    }
    return matchesCustomTerritory(demand)(p);
  };

/** Une perm organisation matche ssi la demande est affectée à un réseau rattaché à cette organisation. */
const matchesOrganization =
  (demand: DemandForAccess) =>
  (p: Permission): boolean =>
    isOrganizationPermissionType(p.type) && demand.network_organization_id !== null && demand.network_organization_id === p.resource_id;

/**
 * Vrai ssi l'utilisateur peut **consulter** cette demande (tableau, export, historique mail, etc.).
 * - admin : toujours
 * - rôles sans permissions / demande non validée : jamais
 * - sinon : au moins une permission (réseau OU territoire) matche
 */
export const canUserAccessDemand = (user: UserWithRole, permissions: Permission[], demand: DemandForAccess): boolean => {
  if (user.role === 'admin') return true;
  if (!isHeatNetworkDemandRole(user.role) || !demand.validated) return false;

  return permissions.some((p) => matchesNetworkAffectation(demand)(p) || matchesOrganization(demand)(p) || matchesTerritory(demand)(p));
};

/**
 * Vrai ssi l'utilisateur doit **traiter** cette demande (statut, contact, commentaire, mail).
 * - admin / rôles sans permissions / demande non validée : jamais responsable
 * - demande affectée à un réseau : seule une perm réseau matchante donne la responsabilité
 * - demande sans réseau : toute perm territoire matchante suffit (rôle de triage)
 */
export const isUserResponsibleForDemand = (user: UserWithRole, permissions: Permission[], demand: DemandForAccess): boolean => {
  if (user.role === 'admin' || !isHeatNetworkDemandRole(user.role) || !demand.validated) return false;

  // Demande affectée à un réseau : une perm réseau matchante OU une perm org couvrant ce réseau donne la responsabilité.
  // Demande sans réseau : org ne s'applique pas (scope opérateur = réseaux), seul le territoire (triage) suffit.
  const matches = isAffectedToNetwork(demand)
    ? (p: Permission) => matchesNetworkAffectation(demand)(p) || matchesOrganization(demand)(p)
    : matchesTerritory(demand);
  return permissions.some(matches);
};

/**
 * Retourne les utilisateurs qui ont accès à une demande.
 * Le type de demande détermine les rôles pertinents ; les CCRT ne sont listés que pour la chaleur renouvelable.
 * N'applique pas le filtre `validated` pour permettre l'affichage « qui verra cette demande ».
 */
export const getUsersWithAccessToDemand = async (demand: DemandForAccess, demandType: 'heatNetwork' | 'renewableHeat') => {
  const query = kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.role', 'u.first_name', 'u.last_name', 'u.structure_name'])
    .where('u.active', '=', true)
    .where('u.role', 'in', demandType === 'heatNetwork' ? userRolesWithPermissionsHeatNetwork : userRolesWithPermissionsRenewableHeat)
    .where((eb) => {
      const conditions: Expression<SqlBool>[] = [];

      if (demand.network_id && demand.network_type) {
        conditions.push(eb.and([eb('up.type', '=', demand.network_type), eb('up.resource_id', '=', String(demand.network_id))]));
      }

      if (demand.network_organization_id) {
        conditions.push(eb.and([eb('up.type', '=', 'organization'), eb('up.resource_id', '=', demand.network_organization_id)]));
      }

      for (const [permType, column] of Object.entries(territoryPermissionToColumn) as [
        TerritoryPermissionType,
        (typeof territoryPermissionToColumn)[keyof typeof territoryPermissionToColumn],
      ][]) {
        const value = demand[column];
        if (value) {
          conditions.push(eb.and([eb('up.type', '=', permType), eb('up.resource_id', '=', value)]));
        }
      }

      if (demand.custom_territory_ids.length > 0) {
        conditions.push(
          eb.and([eb('up.type', '=', customTerritoryPermissionType), eb('up.resource_id', 'in', demand.custom_territory_ids)])
        );
      }

      return conditions.length > 0 ? eb.or(conditions) : sql.lit(false);
    })
    .groupBy(['u.id', 'u.email', 'u.role', 'u.first_name', 'u.last_name', 'u.structure_name'])
    .orderBy((eb) => sql<string>`split_part(${eb.ref('u.email')}, '@', 2)`)
    .orderBy((eb) => sql<string>`split_part(${eb.ref('u.email')}, '@', 1)`);

  return query.execute();
};

/**
 * Query selecting the `DemandForAccess` fields of one non-deleted demand. Single source of the access-check
 * projection: callers extend it (`.select(...)`) rather than rebuilding it, so a new access field cannot be forgotten.
 */
export const buildDemandForAccessQuery = (demandId: string) =>
  kdb
    .selectFrom('demands')
    .leftJoin('reseaux_de_chaleur as rdc', (j) =>
      j.onRef('rdc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'reseau_de_chaleur')
    )
    .leftJoin('zones_et_reseaux_en_construction as zrc', (j) =>
      j.onRef('zrc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'reseau_en_construction')
    )
    .select([
      'demands.network_id',
      'demands.network_type',
      'demands.validated',
      'demands.commune_code',
      'demands.epci_code',
      'demands.ept_code',
      'demands.departement_code',
      'demands.region_code',
      'demands.custom_territory_ids',
    ])
    .select((eb) => eb.fn.coalesce('rdc.organization_id', 'zrc.organization_id').as('network_organization_id'))
    .where('demands.id', '=', demandId)
    .where('demands.deleted_at', 'is', null);

/**
 * Loads a demand with the fields needed for access checks.
 */
export const getDemandForAccessCheck = async (demandId: string): Promise<DemandForAccess | null> =>
  (await buildDemandForAccessQuery(demandId).executeTakeFirst()) ?? null;
