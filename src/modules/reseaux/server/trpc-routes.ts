import { z } from 'zod';

import {
  zApplyGeometriesUpdatesInput,
  zCreateNetworkInput,
  zDeleteGeomUpdateInput,
  zDeleteNetworkInput,
  zFindByCoordsInput,
  zGetNetworkEligibilityStatusInput,
  zUpdateGeomUpdateInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { route, routeRole, router } from '@/modules/trpc/server';
import db from '@/server/db';
import { getCityEligilityStatus, getEligilityStatus, getNetworkEligilityStatus } from '@/server/services/addresseInformation';

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
  bulkEligibilityValues: route.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const existingValue = await db('eligibility_tests').where('id', input.id).first();
    if (existingValue) {
      return {
        error: existingValue.in_error,
        id: existingValue.id,
        progress: existingValue.progress / existingValue.addresses_count,
        result: JSON.parse(existingValue.result),
      };
    }
    return {
      id: input.id,
      progress: 0,
    };
  }),
  createNetwork: adminRoute.input(zCreateNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.createNetwork(input.id as string, input.geometry, input.type);
  }),
  deleteGeomUpdate: adminRoute.input(zDeleteGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.deleteGeomUpdate(input.id as number, input.type);
  }),
  deleteNetwork: adminRoute.input(zDeleteNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.deleteNetwork(input.id as number, input.type);
  }),
  findByCoords: route.input(zFindByCoordsInput).query(async ({ input }) => {
    if (input.isCity) {
      const cityNetwork = await getCityEligilityStatus(input.city);
      // Convertir CityNetwork en HeatNetworksResponse
      return {
        ...cityNetwork,
        basedOnCity: true as const,
        co2: null,
        distance: null,
        futurNetwork: false,
        gestionnaire: null,
        hasNoTraceNetwork: null,
        hasPDP: null,
        id: null,
        inPDP: false,
        isClasse: null,
        isEligible: false,
        name: null,
        tauxENRR: null,
        veryEligibleDistance: null,
      };
    } else {
      const heatNetwork = await getEligilityStatus(input.lat, input.lon, input.city);
      // Convertir HeatNetwork en HeatNetworksResponse
      return {
        ...heatNetwork,
        basedOnCity: false,
        cityHasFuturNetwork: false,
        cityHasNetwork: false,
      };
    }
  }),
  // Routes publiques pour l'éligibilité et la recherche de réseaux
  getNetworkEligibilityStatus: route.input(zGetNetworkEligibilityStatusInput).query(async ({ input }) => {
    return await getNetworkEligilityStatus(input.networkId, input.lat, input.lon);
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
    return await reseauxService.updateGeomUpdate(input.id as number, input.geometry, input.type);
  }),
});
