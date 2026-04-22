import { z } from 'zod';

import {
  networkTypes,
  zApplyGeometriesUpdatesInput,
  zCreateNetworkInput,
  zDeleteGeomUpdateInput,
  zDeleteNetworkInput,
  zDownloadNetworkGeometryInput,
  zGetNetworkEligibilityStatusInput,
  zUpdateGeomUpdateInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { adminRoute, demandAccessRoute, route, router } from '@/modules/trpc/server';
import { getCityEligilityStatus, getEligilityStatus, getNetworkEligilityStatus } from '@/server/services/addresseInformation';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

import * as reseauxService from './service';

const reseauDeChaleurRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxDeChaleur();
  }),
  updateTags: adminRoute.input(zUpdateReseauInput).mutation(async ({ input }) => {
    return await reseauxService.updateTags(input.id, input.tags);
  }),
});

const reseauEnConstructionRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxEnConstruction();
  }),
  updateTags: adminRoute.input(zUpdateReseauEnConstructionInput).mutation(async ({ input }) => {
    return await reseauxService.updateReseauEnConstruction(input.id, input.tags);
  }),
});

const reseauDeFroidRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxDeFroid();
  }),
});

const perimetreDeDeveloppementPrioritaireRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listPerimetresDeDeveloppementPrioritaire();
  }),
  update: adminRoute.input(zUpdatePerimetreDeDeveloppementPrioritaireInput).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return await reseauxService.updatePerimetreDeDeveloppementPrioritaire(id, data);
  }),
});

const networkRemindersRouter = router({
  create: adminRoute
    .input(
      z.object({
        createdAt: z.string().optional(),
        networkId: z.number(),
        networkType: z.enum(networkTypes),
        note: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return reseauxService.createNetworkReminder({
        author_id: ctx.user.id,
        created_at: input.createdAt ? new Date(input.createdAt) : undefined,
        network_id: input.networkId,
        network_type: input.networkType,
        note: input.note ?? null,
      });
    }),
  updateNotes: adminRoute
    .input(
      z.object({
        networkId: z.number(),
        networkType: z.enum(networkTypes),
        notes: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await reseauxService.updateNetworkNotes(input.networkId, input.networkType, input.notes);
    }),
});

export const reseauxRouter = router({
  applyGeometriesUpdates: adminRoute
    .input(zApplyGeometriesUpdatesInput)
    .mutation(async ({ input, ctx }) => await reseauxService.applyGeometriesUpdates(input, ctx)),
  cityNetwork: route.input(z.object({ city: z.string() })).query(async ({ input }) => {
    return (await getCityEligilityStatus(input.city)) as HeatNetworksResponse; // legacy type for compatibility
  }),
  createNetwork: adminRoute.input(zCreateNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.createNetwork(input.id, input.geometry, input.type);
  }),
  deleteGeomUpdate: adminRoute.input(zDeleteGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.deleteGeomUpdate(input.id, input.type);
  }),
  deleteNetwork: adminRoute.input(zDeleteNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.deleteNetwork(input.id, input.type);
  }),
  eligibilityStatus: route.input(z.object({ lat: z.number(), lon: z.number() })).query(async ({ input }) => {
    return (await getEligilityStatus(input.lat, input.lon)) as HeatNetworksResponse; // legacy type for compatibility
  }),
  // Routes publiques pour l'éligibilité et la recherche de réseaux
  getNetworkEligibilityStatus: route.input(zGetNetworkEligibilityStatusInput).query(async ({ input }) => {
    return await getNetworkEligilityStatus(input.networkId, input.lat, input.lon);
  }),
  getNetworkGeometry: route.input(zDownloadNetworkGeometryInput).query(async ({ input }) => {
    return await reseauxService.getNetworkGeometry(input.type, input.id);
  }),
  // Route publique pour lister tous les réseaux (utilisé pour la comparaison)
  listNetworks: route.query(async () => {
    return await reseauxService.listNetworks();
  }),
  networkReminders: networkRemindersRouter,
  perimetreDeDeveloppementPrioritaire: perimetreDeDeveloppementPrioritaireRouter,
  // Sous-routeurs par type
  reseauDeChaleur: reseauDeChaleurRouter,
  reseauDeFroid: reseauDeFroidRouter,
  reseauEnConstruction: reseauEnConstructionRouter,
  searchNetworks: demandAccessRoute.input(z.object({ search: z.string().min(2) })).query(async ({ input }) => {
    return await reseauxService.searchNetworks(input.search);
  }),

  // Opérations communes à tous les types
  updateGeomUpdate: adminRoute.input(zUpdateGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.updateGeomUpdate(input.id, input.geometry, input.type);
  }),
});
