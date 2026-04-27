import { type Expression, type Selectable, type SelectQueryBuilder, type SqlBool, sql } from 'kysely';

import type { DB, Demands } from '@/server/db/kysely';
import { kdb } from '@/server/db/kysely';
import { type UserRole, userRolesWithPermissions } from '@/types/enum/UserRole';

import { type NetworkPermission, type Permission, type TerritoryPermissionType, territoryPermissionToColumn } from '../types';
import { isNetworkPermissionType, isRoleWithPermissions, networkTypeToPermissionType, permissionTypeToNetworkType } from './helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserWithRole = {
  id: string;
  role: UserRole;
};

export type DemandForAccess = Pick<
  Selectable<Demands>,
  'network_id' | 'network_type' | 'validated' | 'commune_code' | 'epci_code' | 'ept_code' | 'departement_code' | 'region_code'
>;

// ─── Access filters (Kysely query builders) ──────────────────────────────────

/**
 * Builds a Kysely WHERE filter for demands accessible by a given user.
 * Executes in DB with indexes — no JS-side filtering.
 */
export const buildDemandAccessFilter = (
  user: UserWithRole,
  permissions: Permission[]
): (<O>(qb: SelectQueryBuilder<DB, 'demands', O>) => SelectQueryBuilder<DB, 'demands', O>) => {
  return (qb) => {
    if (user.role === 'admin') {
      return qb;
    }

    if (!isRoleWithPermissions(user.role)) {
      return qb.where(sql.lit(false));
    }

    qb = qb.where('demands.validated', '=', true);

    if (permissions.length === 0) {
      return qb.where(sql.lit(false));
    }

    const networkPerms = permissions.filter((p): p is NetworkPermission => isNetworkPermissionType(p.type));
    const territoryPerms = permissions.filter((p) => !isNetworkPermissionType(p.type));

    return qb.where((eb) => {
      const conditions: Expression<SqlBool>[] = [];

      for (const p of networkPerms) {
        conditions.push(
          eb.and([
            eb('demands.network_id', '=', Number(p.resource_id)),
            eb('demands.network_type', '=', permissionTypeToNetworkType[p.type]),
          ])
        );
      }

      if (territoryPerms.some((p) => p.type === 'national')) {
        conditions.push(sql.lit(true));
      } else {
        for (const p of territoryPerms) {
          if (p.type in territoryPermissionToColumn) {
            const column = territoryPermissionToColumn[p.type as keyof typeof territoryPermissionToColumn];
            conditions.push(eb(`demands.${column}` as any, '=', p.resource_id));
          }
        }
      }

      return conditions.length > 0 ? eb.or(conditions) : sql.lit(false);
    });
  };
};

// ─── Permission matchers (in-memory) ─────────────────────────────────────────

const isAffectedToNetwork = (demand: DemandForAccess): boolean => demand.network_id !== null && demand.network_type !== null;

/** Une perm réseau matche ssi elle cible le réseau exact auquel la demande est affectée. */
const matchesNetworkAffectation =
  (demand: DemandForAccess) =>
  (p: Permission): boolean =>
    isNetworkPermissionType(p.type) &&
    permissionTypeToNetworkType[p.type] === demand.network_type &&
    Number(p.resource_id) === demand.network_id;

/** Une perm territoire matche ssi elle couvre la maille géographique de la demande (`national` couvre tout). */
const matchesTerritory =
  (demand: DemandForAccess) =>
  (p: Permission): boolean => {
    if (p.type === 'national') return true;
    if (p.type in territoryPermissionToColumn) {
      const column = territoryPermissionToColumn[p.type as keyof typeof territoryPermissionToColumn];
      return demand[column] === p.resource_id;
    }
    return false;
  };

/**
 * Vrai ssi l'utilisateur peut **consulter** cette demande (tableau, export, historique mail, etc.).
 * - admin : toujours
 * - rôles sans permissions / demande non validée : jamais
 * - sinon : au moins une permission (réseau OU territoire) matche
 */
export const canUserAccessDemand = (user: UserWithRole, permissions: Permission[], demand: DemandForAccess): boolean => {
  if (user.role === 'admin') return true;
  if (!isRoleWithPermissions(user.role) || !demand.validated) return false;

  return permissions.some((p) => matchesNetworkAffectation(demand)(p) || matchesTerritory(demand)(p));
};

/**
 * Vrai ssi l'utilisateur doit **traiter** cette demande (statut, contact, commentaire, mail).
 * - admin / rôles sans permissions / demande non validée : jamais responsable
 * - demande affectée à un réseau : seule une perm réseau matchante donne la responsabilité
 * - demande sans réseau : toute perm territoire matchante suffit (rôle de triage)
 */
export const isUserResponsibleForDemand = (user: UserWithRole, permissions: Permission[], demand: DemandForAccess): boolean => {
  if (user.role === 'admin' || !isRoleWithPermissions(user.role) || !demand.validated) return false;

  const matches = isAffectedToNetwork(demand) ? matchesNetworkAffectation(demand) : matchesTerritory(demand);
  return permissions.some(matches);
};

/**
 * Retourne les utilisateurs qui ont accès à une demande.
 * N'applique pas le filtre `validated` pour permettre l'affichage « qui verra cette demande ».
 */
export const getUsersWithAccessToDemand = async (demand: DemandForAccess) => {
  const query = kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.role', 'u.first_name', 'u.last_name', 'u.structure_name'])
    .where('u.active', '=', true)
    .where('u.role', 'in', [...userRolesWithPermissions])
    .where((eb) => {
      const conditions: Expression<SqlBool>[] = [];

      if (demand.network_id && demand.network_type) {
        const permType = networkTypeToPermissionType[demand.network_type];
        conditions.push(eb.and([eb('up.type', '=', permType), eb('up.resource_id', '=', String(demand.network_id))]));
      }

      conditions.push(eb('up.type', '=', 'national'));

      for (const [permType, column] of Object.entries(territoryPermissionToColumn) as [
        Exclude<TerritoryPermissionType, 'national'>,
        (typeof territoryPermissionToColumn)[keyof typeof territoryPermissionToColumn],
      ][]) {
        const value = demand[column];
        if (value) {
          conditions.push(eb.and([eb('up.type', '=', permType), eb('up.resource_id', '=', value)]));
        }
      }

      return conditions.length > 0 ? eb.or(conditions) : sql.lit(false);
    })
    .groupBy(['u.id', 'u.email', 'u.role', 'u.first_name', 'u.last_name', 'u.structure_name']);

  return query.execute();
};

/**
 * Loads a demand with the fields needed for access checks.
 */
export const getDemandForAccessCheck = async (demandId: string): Promise<DemandForAccess | null> => {
  const result = await kdb
    .selectFrom('demands')
    .select(['network_id', 'network_type', 'validated', 'commune_code', 'epci_code', 'ept_code', 'departement_code', 'region_code'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();
  return result ?? null;
};
