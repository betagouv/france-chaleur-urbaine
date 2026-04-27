import { z } from 'zod';

import { anonymizeEmail, anonymizeName } from '@/modules/demands/server/helpers';
import { adminRoute, demandAccessRoute, router } from '@/modules/trpc/server';

import { zPermissionInput } from '../types';
import { getDemandForAccessCheck, getUsersWithAccessToDemand } from './demand-access';
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

  listUsersWithAccessToDemand: demandAccessRoute.input(z.object({ demandId: z.uuidv4() })).query(async ({ input, ctx }) => {
    const demand = await getDemandForAccessCheck(input.demandId);
    if (!demand) return [];
    const users = await getUsersWithAccessToDemand(demand);
    if (!ctx.anonymize) return users;
    return users.map((u) => ({
      ...u,
      email: anonymizeEmail(u.email),
      first_name: anonymizeName(u.first_name ?? undefined),
      last_name: anonymizeName(u.last_name ?? undefined),
      structure_name: anonymizeName(u.structure_name ?? undefined),
    }));
  }),

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
});
