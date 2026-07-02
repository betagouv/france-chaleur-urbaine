import { z } from 'zod';

import { adminRoute, router } from '@/modules/trpc/server';

import { zCreateOrganization, zUpdateOrganization } from '../constants';
import {
  assignNetworks,
  countChaleurNetworksByPattern,
  createCredential,
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizationNetworkDrift,
  listCredentials,
  listOrganizationChaleurNetworks,
  listOrganizations,
  refreshOrganizationNetworks,
  revokeCredential,
  setOrganizationPatterns,
  updateOrganization,
} from './service';

export const organizationsRouter = router({
  admin: {
    create: adminRoute.input(zCreateOrganization).mutation(({ ctx, input }) => createOrganization(input, ctx.user.id)),

    credentials: {
      create: adminRoute
        .input(z.object({ name: z.string().trim().min(1).max(255).optional(), organizationId: z.uuidv4() }))
        .mutation(({ input }) => createCredential(input.organizationId, input.name ?? null)),
      list: adminRoute.input(z.object({ organizationId: z.uuidv4() })).query(({ input }) => listCredentials(input.organizationId)),
      revoke: adminRoute.input(z.object({ id: z.uuidv4() })).mutation(({ input }) => revokeCredential(input.id)),
    },

    delete: adminRoute.input(z.object({ id: z.uuidv4() })).mutation(({ ctx, input }) => deleteOrganization(input.id, ctx.user.id)),

    get: adminRoute.input(z.object({ id: z.uuidv4() })).query(({ input }) => getOrganization(input.id)),

    list: adminRoute.query(() => listOrganizations()),

    networks: {
      detach: adminRoute
        .input(z.object({ idFcu: z.number().int() }))
        .mutation(({ input }) => assignNetworks('reseaux_de_chaleur', [input.idFcu], null)),
      drift: adminRoute
        .input(z.object({ organizationId: z.uuidv4() }))
        .query(({ input }) => getOrganizationNetworkDrift(input.organizationId)),
      list: adminRoute
        .input(z.object({ organizationId: z.uuidv4() }))
        .query(({ input }) => listOrganizationChaleurNetworks(input.organizationId)),
      previewPattern: adminRoute
        .input(z.object({ pattern: z.string().trim().min(2).max(255) }))
        .query(({ input }) => countChaleurNetworksByPattern(input.pattern)),
      refresh: adminRoute
        .input(z.object({ organizationId: z.uuidv4() }))
        .mutation(({ input }) => refreshOrganizationNetworks(input.organizationId)),
      setPatterns: adminRoute
        .input(z.object({ organizationId: z.uuidv4(), patterns: z.array(z.string().trim().min(2).max(255)).max(20) }))
        .mutation(({ ctx, input }) => setOrganizationPatterns(input.organizationId, input.patterns, ctx.user.id)),
    },

    update: adminRoute
      .input(zUpdateOrganization.extend({ id: z.uuidv4() }))
      .mutation(({ ctx, input }) => updateOrganization(input.id, input, ctx.user.id)),
  },
});
