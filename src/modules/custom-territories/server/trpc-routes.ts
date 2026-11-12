import { z } from 'zod';

import { adminRoute, router } from '@/modules/trpc/server';

import { zCreateCustomTerritory, zCustomTerritoryRecipe, zUpdateCustomTerritory } from '../constants';
import {
  createCustomTerritory,
  deleteCustomTerritory,
  getCustomTerritory,
  listCustomTerritories,
  previewRecipe,
  previewRecipeGeometry,
  updateCustomTerritory,
} from './service';

export const customTerritoriesRouter = router({
  admin: {
    create: adminRoute.input(zCreateCustomTerritory).mutation(({ ctx, input }) => createCustomTerritory(input, ctx.user.id)),

    delete: adminRoute.input(z.object({ id: z.uuidv4() })).mutation(({ ctx, input }) => deleteCustomTerritory(input.id, ctx.user.id)),

    get: adminRoute.input(z.object({ id: z.uuidv4() })).query(({ input }) => getCustomTerritory(input.id)),

    list: adminRoute.query(() => listCustomTerritories()),

    previewRecipe: adminRoute.input(zCustomTerritoryRecipe).query(({ input }) => previewRecipe(input)),

    previewRecipeGeometry: adminRoute.input(zCustomTerritoryRecipe).query(({ input }) => previewRecipeGeometry(input)),

    update: adminRoute
      .input(zUpdateCustomTerritory.extend({ id: z.uuidv4() }))
      .mutation(({ ctx, input }) => updateCustomTerritory(input.id, input, ctx.user.id)),
  },
});
