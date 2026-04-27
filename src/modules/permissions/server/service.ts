import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { type UserRole, userRolesWithPermissions } from '@/types/enum/UserRole';

import { MAX_PERMISSIONS_PER_USER, type Permission } from '../types';

// Re-export for external callers (context-builder, demands-service, manager, trpc-helpers)
export {
  buildDemandAccessFilter,
  canUserAccessDemand,
  type DemandForAccess,
  getDemandForAccessCheck,
  getUsersWithAccessToDemand,
  isUserResponsibleForDemand,
} from './demand-access';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserWithPermissions = {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  receive_new_demands: boolean;
  receive_old_demands: boolean;
};

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Loads all active users with permissions in a single query.
 * Used by crons to avoid N+1 when matching demands to users.
 */
export const getAllUsersWithPermissions = async (): Promise<UserWithPermissions[]> => {
  const rows = await kdb
    .selectFrom('users as u')
    .leftJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.id', 'u.email', 'u.role', 'u.receive_new_demands', 'u.receive_old_demands'])
    .select(
      sql<
        Permission[]
      >`coalesce(json_agg(json_build_object('type', ${sql.ref('up.type')}, 'resource_id', ${sql.ref('up.resource_id')})) filter (where ${sql.ref('up.user_id')} is not null), '[]'::json)`.as(
        'permissions'
      )
    )
    .where('u.active', '=', true)
    .where('u.role', 'in', [...userRolesWithPermissions])
    .groupBy(['u.id', 'u.email', 'u.role', 'u.receive_new_demands', 'u.receive_old_demands'])
    .execute();

  return rows.map((row) => ({
    email: row.email,
    id: row.id,
    permissions: row.permissions,
    receive_new_demands: row.receive_new_demands ?? true,
    receive_old_demands: row.receive_old_demands ?? true,
    role: row.role,
  }));
};

export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  const rows = await kdb.selectFrom('user_permissions').select(['type', 'resource_id']).where('user_id', '=', userId).execute();
  return rows as Permission[];
};

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Replaces all permissions for a user. Any role with permissions can have any mix of types.
 */
export const setUserPermissions = async (userId: string, permissions: Permission[]): Promise<void> => {
  if (permissions.length > MAX_PERMISSIONS_PER_USER) {
    throw new Error(`Maximum ${MAX_PERMISSIONS_PER_USER} permissions par utilisateur`);
  }

  await kdb.transaction().execute(async (tx) => {
    await tx.deleteFrom('user_permissions').where('user_id', '=', userId).execute();

    if (permissions.length > 0) {
      await tx
        .insertInto('user_permissions')
        .values(
          permissions.map((p) => ({
            resource_id: p.resource_id,
            type: p.type,
            user_id: userId,
          }))
        )
        .execute();
    }
  });
};
