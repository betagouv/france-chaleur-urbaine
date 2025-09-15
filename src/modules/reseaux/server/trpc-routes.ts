import {
  zUpdateGeometryInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { router, routeRole } from '@/modules/trpc/server';

import * as reseauxService from './service';

const adminRoute = routeRole(['admin']);

export const reseauxRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxDeChaleur();
  }),
  updateTags: adminRoute.input(zUpdateReseauInput).mutation(async ({ input }) => {
    return await reseauxService.updateTags(input.id, input.tags);
  }),
  updateGeometry: adminRoute.input(zUpdateGeometryInput).mutation(async ({ input }) => {
    return await reseauxService.updateGeometry(input.id, input.geometry);
  }),
  listEnConstruction: adminRoute.query(async () => {
    return await reseauxService.listReseauxEnConstruction();
  }),
  updateEnConstructionTags: adminRoute.input(zUpdateReseauEnConstructionInput).mutation(async ({ input }) => {
    return await reseauxService.updateReseauEnConstruction(input.id, input.tags);
  }),
  listPerimetresDeDeveloppementPrioritaire: adminRoute.query(async () => {
    return await reseauxService.listPerimetresDeDeveloppementPrioritaire();
  }),
  updatePerimetreDeDeveloppementPrioritaire: adminRoute
    .input(zUpdatePerimetreDeDeveloppementPrioritaireInput)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await reseauxService.updatePerimetreDeDeveloppementPrioritaire(id, data);
    }),
});
