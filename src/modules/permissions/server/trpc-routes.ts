import { z } from 'zod';

import { anonymizeEmail, anonymizeName } from '@/modules/demands/server/helpers';
import { searchNetworks } from '@/modules/reseaux/server/service';
import { adminRoute, demandAccessRoute, router } from '@/modules/trpc/server';

import { zPermissionInput } from '../types';
import { getDemandForAccessCheck, getUsersWithAccessToDemand } from './demand-access';
import { getPermissionsMapData } from './map-data';
import {
  findReseauxDeChaleurBySncuIds,
  getUserPermissionsWithLabels,
  resolvePermissionLabels,
  resolvePermissionsWithLabels,
  searchOrganizations,
  searchTerritories,
} from './search';
import { setUserPermissions } from './service';

export const permissionsRouter = router({
  admin: {
    findReseauxDeChaleurBySncuIds: adminRoute
      .input(z.object({ sncuIds: z.array(z.string().min(1).max(5)).min(1).max(500) }))
      .query(({ input }) => findReseauxDeChaleurBySncuIds(input.sncuIds)),

    getForUser: adminRoute.input(z.object({ userId: z.uuidv4() })).query(({ input }) => getUserPermissionsWithLabels(input.userId)),

    setForUser: adminRoute
      .input(
        z.object({
          permissions: zPermissionInput,
          userId: z.uuidv4(),
        })
      )
      .mutation(({ ctx, input }) => setUserPermissions(input.userId, input.permissions, ctx.user.id)),
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

  searchNetworks: adminRoute.input(z.object({ search: z.string().min(2).max(100) })).query(({ input }) => searchNetworks(input.search)),

  searchOrganizations: adminRoute
    .input(z.object({ search: z.string().min(2).max(100) }))
    .query(({ input }) => searchOrganizations(input.search)),

  searchTerritories: adminRoute
    .input(
      z.object({
        query: z.string().min(2).max(100),
        types: z.array(z.string()).optional(),
      })
    )
    .query(({ input }) => searchTerritories(input.query, input.types)),
});
