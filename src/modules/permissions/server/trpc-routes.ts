import { z } from 'zod';

import { adminRoute, demandAccessRoute, router } from '@/modules/trpc/server';

import { type TerritoryPermission, zPermissionInput } from '../types';
import { getDemandForAccessCheck, getNetworkUsersForTerritory, getUsersWithAccessToDemand } from './demand-access';
import { isNetworkPermissionType } from './helpers';
import { getPermissionsMapData } from './map-data';
import {
  getAllPermissionsWithLabels,
  getUserPermissionsWithLabels,
  resolvePermissionLabels,
  resolvePermissionsWithLabels,
  searchNetworks,
  searchTerritories,
} from './search';
import { setUserPermissions } from './service';

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

  mine: demandAccessRoute.query(({ ctx }) => ctx.getPermissions()),

  mineWithLabels: demandAccessRoute.query(async ({ ctx }) => resolvePermissionsWithLabels(await ctx.getPermissions())),

  myMapData: demandAccessRoute.query(async ({ ctx }) => getPermissionsMapData(await ctx.getPermissions())),

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
    const permissions = await ctx.getPermissions();
    const territoryPerms = permissions.filter((p): p is TerritoryPermission => !isNetworkPermissionType(p.type));
    return getNetworkUsersForTerritory(territoryPerms);
  }),

  usersWithAccessToDemand: demandAccessRoute.input(z.object({ demandId: z.uuidv4() })).query(async ({ input }) => {
    const demand = await getDemandForAccessCheck(input.demandId);
    if (!demand) return [];
    return getUsersWithAccessToDemand(demand);
  }),
});
