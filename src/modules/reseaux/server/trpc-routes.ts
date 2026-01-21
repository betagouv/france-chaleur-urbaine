import { z } from 'zod';

import {
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
import { route, routeRole, router } from '@/modules/trpc/server';
import { getCityEligilityStatus, getEligilityStatus, getNetworkEligilityStatus } from '@/server/services/addresseInformation';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

import * as reseauxService from './service';

const adminRoute = routeRole(['admin']);

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
  perimetreDeDeveloppementPrioritaire: perimetreDeDeveloppementPrioritaireRouter,
  // Sous-routeurs par type
  reseauDeChaleur: reseauDeChaleurRouter,
  reseauDeFroid: reseauDeFroidRouter,
  reseauEnConstruction: reseauEnConstructionRouter,

  // Opérations communes à tous les types
  updateGeomUpdate: adminRoute.input(zUpdateGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.updateGeomUpdate(input.id, input.geometry, input.type);
  }),
});
