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

/**
 * Checks if a user can access a specific demand (in-memory check for single demand).
 */
export const canUserAccessDemand = (user: UserWithRole, permissions: Permission[], demand: DemandForAccess): boolean => {
  if (user.role === 'admin') {
    return true;
  }

  if (!isRoleWithPermissions(user.role)) {
    return false;
  }

  if (!demand.validated) {
    return false;
  }

  return permissions.some((p) => {
    if (isNetworkPermissionType(p.type)) {
      return Number(p.resource_id) === demand.network_id && permissionTypeToNetworkType[p.type] === demand.network_type;
    }
    if (p.type === 'national') {
      return true;
    }
    if (p.type in territoryPermissionToColumn) {
      const column = territoryPermissionToColumn[p.type as keyof typeof territoryPermissionToColumn];
      return demand[column] === p.resource_id;
    }
    return false;
  });
};

/**
 * Returns users who have access to a specific demand.
 */
export const getUsersWithAccessToDemand = async (demand: DemandForAccess) => {
  if (!demand.validated) {
    return [];
  }

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
