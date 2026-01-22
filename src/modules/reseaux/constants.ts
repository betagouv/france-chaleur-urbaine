import { z } from 'zod';

import type { DatabaseSourceId } from '@/modules/tiles/tiles.config';
import type { DBTableName } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import { defineSubsetConfig, ObjectKeys } from '@/utils/typescript';
import { zGeometry } from '@/utils/validation';

export const zUpdateReseauInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export type UpdateReseauInput = z.infer<typeof zUpdateReseauInput>;

const tableNames = [
  'reseaux_de_chaleur',
  'zones_et_reseaux_en_construction',
  'zone_de_developpement_prioritaire',
  'reseaux_de_froid',
] as const;

// Geometry updates types
export const zApplyGeometriesUpdatesInput = z.strictObject({
  name: z.enum(['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'], {
    message: 'Le nom de la table est invalide',
  }),
});

export type ApplyGeometriesUpdatesInput = z.infer<typeof zApplyGeometriesUpdatesInput>;

export const zUpdateReseauEnConstructionInput = z.object({
  id: z.number(),
  tags: z.array(z.string()),
});

export const zUpdateGeomUpdateInput = z.object({
  geometry: zGeometry,
  id: z.number(),
  type: z.enum(tableNames),
});

export type UpdateGeomUpdateInput = z.infer<typeof zUpdateGeomUpdateInput>;

export type UpdateReseauEnConstructionInput = z.infer<typeof zUpdateReseauEnConstructionInput>;

export const zUpdatePerimetreDeDeveloppementPrioritaireInput = z.object({
  'Identifiant reseau': z.string().optional(),
  id: z.number(),
  reseau_de_chaleur_ids: z.array(z.number()).optional(),
  reseau_en_construction_ids: z.array(z.number()).optional(),
});

export type UpdatePerimetreDeDeveloppementPrioritaireInput = z.infer<typeof zUpdatePerimetreDeDeveloppementPrioritaireInput>;

export const zGetNetworkEligibilityStatusInput = z.object({
  lat: z.number(),
  lon: z.number(),
  networkId: z.string(),
});

export type GetNetworkEligibilityStatusInput = z.infer<typeof zGetNetworkEligibilityStatusInput>;

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
  geometry: zGeometry,
  id: z.string(), // String pour supporter à la fois les ID numériques et les identifiants réseau
  type: z.enum(tableNames),
});

export type CreateNetworkInput = z.infer<typeof zCreateNetworkInput>;

export const zDownloadNetworkGeometryInput = z.object({
  id: z.number(),
  type: z.enum(tableNames),
});

export type DownloadNetworkGeometryInput = z.infer<typeof zDownloadNetworkGeometryInput>;

export const gestionnairesFilters = [
  {
    label: 'Coriance',
    value: 'coriance',
  },
  { label: 'Dalkia', value: 'dalkia' },
  { label: 'ENGIE Solutions', value: 'engie' },
  { label: 'IDEX', value: 'idex' },
  { label: 'Autre', value: 'autre' },
];

export const airtableSynchronizableNetworkTableConfig = defineSubsetConfig<DatabaseSourceId, { airtable: Airtable; table: DBTableName }>()({
  reseauxDeChaleur: {
    airtable: Airtable.NETWORKS,
    table: 'reseaux_de_chaleur',
  },
  reseauxDeFroid: {
    airtable: Airtable.COLD_NETWORKS,
    table: 'reseaux_de_froid',
  },
  reseauxEnConstruction: {
    airtable: Airtable.FUTUR_NETWORKS,
    table: 'zones_et_reseaux_en_construction',
  },
});

export const zAirtableSynchronizableNetworkTable = z.enum(ObjectKeys(airtableSynchronizableNetworkTableConfig));
export type AirtableSynchronizableNetworkTable = z.infer<typeof zAirtableSynchronizableNetworkTable>;
