import { z } from 'zod';

import { zGeometry } from '@/utils/validation';

export const zUpdateReseauInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export type UpdateReseauInput = z.infer<typeof zUpdateReseauInput>;

const tableNames = ['reseaux_de_chaleur', 'zones_et_reseaux_en_construction', 'zone_de_developpement_prioritaire'] as const;

export const zUpdateReseauEnConstructionInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export const zUpdateGeomUpdateInput = z.object({
  id: z.number(),
  geometry: zGeometry,
  type: z.enum(tableNames),
});

export type UpdateGeomUpdateInput = z.infer<typeof zUpdateGeomUpdateInput>;

export type UpdateReseauEnConstructionInput = z.infer<typeof zUpdateReseauEnConstructionInput>;

export const zUpdatePerimetreDeDeveloppementPrioritaireInput = z.object({
  id: z.number(),
  'Identifiant reseau': z.string().optional(),
  reseau_de_chaleur_ids: z.array(z.number()).optional(),
  reseau_en_construction_ids: z.array(z.number()).optional(),
});

export type UpdatePerimetreDeDeveloppementPrioritaireInput = z.infer<typeof zUpdatePerimetreDeDeveloppementPrioritaireInput>;

export const zDeleteGeomUpdateInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DeleteGeomUpdateInput = z.infer<typeof zDeleteGeomUpdateInput>;

export const zDeleteNetworkInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DeleteNetworkInput = z.infer<typeof zDeleteNetworkInput>;

export const zCreateNetworkInput = z.object({
  id: z.string(), // String pour supporter à la fois les ID numériques et les identifiants réseau
  geometry: zGeometry,
  type: z.enum(tableNames),
});

export type CreateNetworkInput = z.infer<typeof zCreateNetworkInput>;
