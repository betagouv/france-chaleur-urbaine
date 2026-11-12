import { z } from 'zod';

import { territoryPermissionResourceTypes } from '@/modules/permissions/types';

/** One administrative territory used as a building block of a recipe (same codes as territory permissions). */
export const zTerritoryRef = z.object({
  code: z.string().trim().min(1).max(20),
  type: z.enum(territoryPermissionResourceTypes),
});

export const MAX_RECIPE_REFS = 50;

/** Communes of the included territories minus the communes of the excluded ones. */
export const zCustomTerritoryRecipe = z.object({
  exclude: z.array(zTerritoryRef).max(MAX_RECIPE_REFS, `Maximum ${MAX_RECIPE_REFS} territoires exclus`),
  include: z
    .array(zTerritoryRef)
    .min(1, 'Ajoutez au moins un territoire à inclure')
    .max(MAX_RECIPE_REFS, `Maximum ${MAX_RECIPE_REFS} territoires inclus`),
});

export const zCreateCustomTerritory = z.object({
  name: z.string().trim().min(1, 'Le nom est requis').max(255, '255 caractères maximum'),
  recipe: zCustomTerritoryRecipe,
});

export const zUpdateCustomTerritory = zCreateCustomTerritory;

export type TerritoryRef = z.infer<typeof zTerritoryRef>;
export type CustomTerritoryRecipe = z.infer<typeof zCustomTerritoryRecipe>;
export type CreateCustomTerritoryInput = z.infer<typeof zCreateCustomTerritory>;
export type UpdateCustomTerritoryInput = z.infer<typeof zUpdateCustomTerritory>;
