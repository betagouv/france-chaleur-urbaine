import { z } from 'zod';

import { adminRoute, demandAccessRoute, router } from '@/modules/trpc/server';

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
    allWithLabels: adminRoute.query(() => getAllPermissionsWithLabels()),

    getForUser: adminRoute.input(z.object({ userId: z.uuidv4() })).query(({ input }) => getUserPermissionsWithLabels(input.userId)),

    setForUser: adminRoute
      .input(
        z.object({
          permissions: zPermissionInput,
          userId: z.uuidv4(),
        })
      )
      .mutation(({ input }) => setUserPermissions(input.userId, input.permissions)),
  },

  mine: demandAccessRoute.query(({ ctx }) => getUserPermissions(ctx.user.id)),

  mineWithLabels: demandAccessRoute.query(({ ctx }) => getUserPermissionsWithLabels(ctx.user.id)),

  myMapData: demandAccessRoute.query(async ({ ctx }) => {
    const permissions = await getUserPermissions(ctx.user.id);
    return getPermissionsMapData(permissions);
  }),

  resolveLabels: demandAccessRoute.input(zPermissionInput).query(({ input }) => resolvePermissionLabels(input)),

  searchNetworks: adminRoute.input(z.object({ query: z.string().min(2).max(100) })).query(({ input }) => searchNetworks(input.query)),

  searchTerritories: adminRoute
    .input(
      z.object({
        query: z.string().min(2).max(100),
        types: z.array(z.string()).optional(),
      })
    )
    .query(({ input }) => searchTerritories(input.query, input.types)),

  territoryGestionnaires: demandAccessRoute.query(async ({ ctx }) => {
    const permissions = await getUserTerritoryPermissions(ctx.user.id);
    return getNetworkUsersForTerritory(permissions);
  }),

  usersWithAccessToDemand: demandAccessRoute.input(z.object({ demandId: z.uuidv4() })).query(async ({ input }) => {
    const demand = await getDemandForAccessCheck(input.demandId);
    if (!demand) return [];
    return getUsersWithAccessToDemand(demand);
  }),
});
