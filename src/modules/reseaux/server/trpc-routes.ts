import {
  zApplyGeometriesUpdatesInput,
  zCreateNetworkInput,
  zDeleteGeomUpdateInput,
  zDeleteNetworkInput,
  zUpdateGeomUpdateInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { routeRole, router } from '@/modules/trpc/server';

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
  createNetwork: adminRoute.input(zCreateNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.createNetwork(input.id as string, input.geometry, input.type);
  }),
  deleteGeomUpdate: adminRoute.input(zDeleteGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.deleteGeomUpdate(input.id as number, input.type);
  }),
  deleteNetwork: adminRoute.input(zDeleteNetworkInput).mutation(async ({ input }) => {
    return await reseauxService.deleteNetwork(input.id as number, input.type);
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
