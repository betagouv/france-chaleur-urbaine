import { z } from 'zod';

import { zGeometry } from '@/utils/validation';

export const zUpdateReseauInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export type UpdateReseauInput = z.infer<typeof zUpdateReseauInput>;

export const zUpdateReseauEnConstructionInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export const zUpdateGeometryInput = z.object({
  id: z.number(),
  geometry: zGeometry,
  type: z.enum(['reseaux_de_chaleur', 'zones_et_reseaux_en_construction', 'zone_de_developpement_prioritaire']),
});

export type UpdateGeometryInput = z.infer<typeof zUpdateGeometryInput>;

export type UpdateReseauEnConstructionInput = z.infer<typeof zUpdateReseauEnConstructionInput>;

export const zUpdatePerimetreDeDeveloppementPrioritaireInput = z.object({
  id: z.number(),
  'Identifiant reseau': z.string().optional(),
  reseau_de_chaleur_ids: z.array(z.number()).optional(),
  reseau_en_construction_ids: z.array(z.number()).optional(),
});

export type UpdatePerimetreDeDeveloppementPrioritaireInput = z.infer<typeof zUpdatePerimetreDeDeveloppementPrioritaireInput>;
