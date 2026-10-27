import { createUserEvent } from '@/modules/events/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb } from '@/server/db/kysely';

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

// ─── Read ────────────────────────────────────────────────────────────────────

export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  const rows = await kdb.selectFrom('user_permissions').select(['type', 'resource_id']).where('user_id', '=', userId).execute();
  return rows as Permission[];
};

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Replaces all permissions for a user. Any role with permissions can have any mix of types.
 * Emits a `user_permissions_updated` event with the diff (added/removed) when something actually changes.
 */
export const setUserPermissions = async (userId: string, permissions: Permission[], authorId: string): Promise<void> => {
  if (permissions.length > MAX_PERMISSIONS_PER_USER) {
    throw new Error(`Maximum ${MAX_PERMISSIONS_PER_USER} permissions par utilisateur`);
  }

  const oldPermissions = await getUserPermissions(userId);

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

  const sameKey = (a: Permission, b: Permission) => a.type === b.type && a.resource_id === b.resource_id;
  const added = permissions.filter((p) => !oldPermissions.some((b) => sameKey(b, p)));
  const removed = oldPermissions.filter((b) => !permissions.some((p) => sameKey(p, b)));

  if (added.length > 0 || removed.length > 0) {
    const targetUser = await kdb.selectFrom('users').select('email').where('id', '=', userId).executeTakeFirstOrThrow();
    await createUserEvent({
      author_id: authorId,
      context_id: userId,
      context_type: 'user',
      data: { added, removed, user_email: targetUser.email },
      type: 'user_permissions_updated',
    });
  }
};

// ─── Network deletion cleanup ──────────────────────────────────────────────────

/**
 * Loads users (id + email) holding a permission on a given network.
 * Network permissions only exist for `reseau_de_chaleur` and `reseau_en_construction`,
 * with `resource_id` being the network `id_fcu` stored as text.
 */
export const getUsersWithNetworkPermission = async (type: NetworkType, resourceId: string): Promise<{ id: string; email: string }[]> => {
  return kdb
    .selectFrom('user_permissions as up')
    .innerJoin('users as u', 'u.id', 'up.user_id')
    .select(['u.id', 'u.email'])
    .where('up.type', '=', type)
    .where('up.resource_id', '=', resourceId)
    .orderBy('u.email')
    .execute();
};

/**
 * Removes the permission targeting a given network from every user holding it.
 * Reuses `setUserPermissions` per user to keep validation and audit event emission consistent.
 */
export const removeNetworkPermissionFromAllUsers = async (type: NetworkType, resourceId: string, authorId: string): Promise<void> => {
  const users = await getUsersWithNetworkPermission(type, resourceId);
  await Promise.all(
    users.map(async (user) => {
      const current = await getUserPermissions(user.id);
      const next = current.filter((p) => !(p.type === type && p.resource_id === resourceId));
      await setUserPermissions(user.id, next, authorId);
    })
  );
};

// ─── Organization deletion cleanup ─────────────────────────────────────────────

/**
 * Retire la permission `organization` ciblant une organisation donnée chez tous les users la détenant.
 * `user_permissions.resource_id` n'a pas de FK vers `organizations` → à appeler avant de supprimer l'org,
 * sinon des permissions orphelines (pointant un id mort) subsistent. Miroir de `removeNetworkPermissionFromAllUsers`.
 */
export const removeOrganizationPermissionFromAllUsers = async (organizationId: string, authorId: string): Promise<void> => {
  const users = await kdb
    .selectFrom('user_permissions')
    .select('user_id')
    .where('type', '=', 'organization')
    .where('resource_id', '=', organizationId)
    .execute();
  await Promise.all(
    users.map(async ({ user_id }) => {
      const current = await getUserPermissions(user_id);
      const next = current.filter((p) => !(p.type === 'organization' && p.resource_id === organizationId));
      await setUserPermissions(user_id, next, authorId);
    })
  );
};
