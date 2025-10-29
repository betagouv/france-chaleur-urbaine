import { z } from 'zod';

import {
  zApplyGeometriesUpdatesInput,
  zCreateNetworkInput,
  zDeleteGeomUpdateInput,
  zDeleteNetworkInput,
  zGetNetworkEligibilityStatusInput,
  zUpdateGeomUpdateInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { route, routeRole, router } from '@/modules/trpc/server';
import { kdb } from '@/server/db/kysely';
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
    const existingValue = await kdb.selectFrom('eligibility_tests').selectAll().where('id', '=', input.id).executeTakeFirst();

    if (existingValue?.result && existingValue?.addresses_count && existingValue.result !== null) {
      const addressesCount = existingValue.addresses_count;
      const errorCount = existingValue.error_count ?? 0;
      const processedCount = addressesCount - errorCount;
      return {
        error: existingValue.in_error ?? false,
        id: existingValue.id,
        progress: addressesCount > 0 ? processedCount / addressesCount : 0,
        result: JSON.parse(existingValue.result),
      };
    }
    return {
      id: input.id,
      progress: 0,
    };
  }),
  cityNetwork: route.input(z.object({ city: z.string() })).query(async ({ input }): Promise<HeatNetworksResponse> => {
    const cityNetwork = await getCityEligilityStatus(input.city);
    // Convertir CityNetwork en HeatNetworksResponse
    return {
      basedOnCity: true,
      cityHasFuturNetwork: cityNetwork.cityHasFuturNetwork,
      cityHasNetwork: cityNetwork.cityHasNetwork,
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
  eligibilityStatus: route
    .input(z.object({ city: z.string(), lat: z.number(), lon: z.number() }))
    .query(async ({ input }): Promise<HeatNetworksResponse> => {
      const heatNetwork = await getEligilityStatus(input.lat, input.lon, input.city);
      // Convertir HeatNetwork en HeatNetworksResponse
      return {
        basedOnCity: false,
        cityHasFuturNetwork: false,
        cityHasNetwork: false,
        co2: heatNetwork.co2,
        distance: heatNetwork.distance,
        futurNetwork: heatNetwork.futurNetwork,
        gestionnaire: heatNetwork.gestionnaire,
        hasNoTraceNetwork: heatNetwork.hasNoTraceNetwork,
        hasPDP: heatNetwork.hasPDP,
        id: heatNetwork.id,
        inPDP: heatNetwork.inPDP,
        isClasse: heatNetwork.isClasse,
        isEligible: heatNetwork.isEligible,
        name: heatNetwork.name,
        tauxENRR: heatNetwork.tauxENRR,
        veryEligibleDistance: heatNetwork.veryEligibleDistance,
      };
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
