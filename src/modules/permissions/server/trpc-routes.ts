import { z } from 'zod';

import { routeRole, router } from '@/modules/trpc/server';
import { userRolesWithPermissions } from '@/types/enum/UserRole';

import { zPermissionInput } from '../types';
import { getDemandForAccessCheck, getNetworkUsersForTerritory, getUsersWithAccessToDemand } from './demand-access';
import { getPermissionsMapData } from './map-data';
import {
  getAllPermissionsWithLabels,
  getUserPermissionsWithLabels,
  resolvePermissionLabels,
  searchNetworks,
  searchTerritories,
} from './search';
import { getUserPermissions, getUserTerritoryPermissions, setUserPermissions } from './service';

export const permissionsRouter = router({
  admin: {
    allWithLabels: routeRole(['admin']).query(() => getAllPermissionsWithLabels()),

    getForUser: routeRole(['admin'])
      .input(z.object({ userId: z.uuidv4() }))
      .query(({ input }) => getUserPermissionsWithLabels(input.userId)),

    setForUser: routeRole(['admin'])
      .input(
        z.object({
          permissions: zPermissionInput,
          userId: z.uuidv4(),
        })
      )
      .mutation(({ input }) => setUserPermissions(input.userId, input.permissions)),
  },

  mine: routeRole([...userRolesWithPermissions]).query(({ ctx }) => getUserPermissions(ctx.user.id)),

  mineWithLabels: routeRole([...userRolesWithPermissions]).query(({ ctx }) => getUserPermissionsWithLabels(ctx.user.id)),

  myMapData: routeRole([...userRolesWithPermissions]).query(async ({ ctx }) => {
    const permissions = await getUserPermissions(ctx.user.id);
    return getPermissionsMapData(permissions);
  }),

  resolveLabels: routeRole(['admin', ...userRolesWithPermissions])
    .input(zPermissionInput)
    .query(({ input }) => resolvePermissionLabels(input)),

  searchNetworks: routeRole(['admin'])
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(({ input }) => searchNetworks(input.query)),

  searchTerritories: routeRole(['admin'])
    .input(
      z.object({
        query: z.string().min(2).max(100),
        types: z.array(z.string()).optional(),
      })
    )
    .query(({ input }) => searchTerritories(input.query, input.types)),

  territoryGestionnaires: routeRole([...userRolesWithPermissions]).query(async ({ ctx }) => {
    const permissions = await getUserTerritoryPermissions(ctx.user.id);
    return getNetworkUsersForTerritory(permissions);
  }),

  usersWithAccessToDemand: routeRole(['admin', ...userRolesWithPermissions])
    .input(z.object({ demandId: z.uuidv4() }))
    .query(async ({ input }) => {
      const demand = await getDemandForAccessCheck(input.demandId);
      if (!demand) return [];
      return getUsersWithAccessToDemand(demand);
    }),
});
