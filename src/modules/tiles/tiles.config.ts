import { z } from 'zod';

import type { buildingsDataExtractionPolygonsSourceId } from '@/components/Map/components/tools/BuildingsDataExtractionTool';
import type {
  distancesMeasurementLabelsSourceId,
  distancesMeasurementLinesSourceId,
} from '@/components/Map/components/tools/DistancesMeasurementTool';
import type {
  linearHeatDensityLabelsSourceId,
  linearHeatDensityLinesSourceId,
} from '@/components/Map/components/tools/LinearHeatDensityTool';
import { Airtable } from '@/types/enum/Airtable';

type BasicTileInfo = {
  properties?: string[];
  sourceLayer?: string;
  id?: string;
};

export type AirtableTileInfo = BasicTileInfo & {
  source: 'airtable';
  table: string;
};

export type DatabaseTileInfo = BasicTileInfo & {
  source: 'database';
  tiles: string;
  compressedTiles?: boolean;
  airtable?: string;
  table?: string;
};

export type TileInfo = AirtableTileInfo | DatabaseTileInfo;

// = id passé en URL de l'API
export const databaseSourceIds = [
  'reseauxDeChaleur',
  'perimetresDeDeveloppementPrioritaire',
  'reseauxEnConstruction',
  'reseauxDeFroid',
  'demands', // demandes d'éligibilité
  'consommationsGaz',
  'batimentsRaccordesReseauxChaleurFroid',
  'enrrMobilisables',
  'enrrMobilisables-friches',
  'enrrMobilisables-parkings',
  'enrrMobilisables-zonesGeothermieProfonde',
  'enrrMobilisables-thalassothermie',
  'installationsGeothermieProfonde',
  'perimetresGeothermieProfonde',
  'installationsGeothermieSurfaceEchangeursOuverts',
  'installationsGeothermieSurfaceEchangeursFermes',
  'ouvragesGeothermieSurfaceEchangeursFermes',
  'ouvragesGeothermieSurfaceEchangeursOuverts',
  'zonesPotentielChaud',
  'zonesPotentielFortChaud',
  'zonesPotentielFroid',
  'zonesPotentielFortFroid',
  'besoinsEnChaleur',
  'besoinsEnChaleurIndustrieCommunes',
  'communesFortPotentielPourCreationReseauxChaleur',
  'quartiersPrioritairesPolitiqueVille2015anru',
  'quartiersPrioritairesPolitiqueVille2024',
  'etudesEnCours',
  'testsAdresses',
  'zonesAUrbaniser',
  'ressourcesGeothermalesNappes',
  'bdnbBatiments', // caractéristiques des bâtiments et types de chauffage des bâtiments
] as const;

export const zDatabaseSourceId = z.enum(databaseSourceIds);
export type DatabaseSourceId = z.infer<typeof zDatabaseSourceId>;

export type InternalSourceId =
  | typeof distancesMeasurementLinesSourceId
  | typeof distancesMeasurementLabelsSourceId
  | typeof linearHeatDensityLinesSourceId
  | typeof linearHeatDensityLabelsSourceId
  | typeof buildingsDataExtractionPolygonsSourceId
  | 'adressesEligibles'
  | 'customGeojson'
  | 'geomUpdate';
export type SourceId = DatabaseSourceId | InternalSourceId;

export const tilesInfo: Record<DatabaseSourceId, TileInfo> = {
  // https://www.notion.so/D-veloppement-e8399345919442748735de25865ebe4a?pvs=4#122c2b5c414b80838207d4f930c68cd7
  batimentsRaccordesReseauxChaleurFroid: {
    compressedTiles: true,
    source: 'database',
    tiles: 'batiments_raccordes_reseaux_chaleur_froid_tiles', // contient 2 layers batiments_raccordes_reseaux_chaleur et batiments_raccordes_reseaux_froid
  },
  bdnbBatiments: {
    compressedTiles: true,
    source: 'database',
    tiles: 'bdnb_batiments_tiles',
  },
  besoinsEnChaleur: {
    compressedTiles: true,
    source: 'database',
    tiles: 'besoins_en_chaleur_tiles',
  },
  besoinsEnChaleurIndustrieCommunes: {
    compressedTiles: true,
    source: 'database',
    tiles: 'besoins_en_chaleur_industrie_communes_tiles',
  },
  communesFortPotentielPourCreationReseauxChaleur: {
    compressedTiles: true,
    source: 'database',
    tiles: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
  },
  consommationsGaz: {
    compressedTiles: true,
    source: 'database',
    tiles: 'donnees_de_consos_tiles',
  },
  demands: {
    properties: ['Mode de chauffage', 'Adresse', 'Type de chauffage', 'Structure'],
    source: 'airtable',
    sourceLayer: 'demands',
    table: Airtable.DEMANDES,
  },
  enrrMobilisables: {
    source: 'database',
    tiles: 'enrr_mobilisables_tiles',
  },
  'enrrMobilisables-friches': {
    source: 'database',
    tiles: 'enrr_mobilisables_friches_tiles',
  },
  'enrrMobilisables-parkings': {
    source: 'database',
    tiles: 'enrr_mobilisables_parkings_tiles',
  },
  'enrrMobilisables-thalassothermie': {
    compressedTiles: true,
    source: 'database',
    tiles: 'enrr_mobilisables_thalassothermie_tiles',
  },
  'enrrMobilisables-zonesGeothermieProfonde': {
    compressedTiles: true,
    source: 'database',
    tiles: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
  },
  etudesEnCours: {
    compressedTiles: true,
    source: 'database',
    tiles: 'etudes_en_cours_tiles',
  },
  installationsGeothermieProfonde: {
    compressedTiles: true,
    source: 'database',
    tiles: 'installations_geothermie_profonde_tiles',
  },
  installationsGeothermieSurfaceEchangeursFermes: {
    compressedTiles: true,
    source: 'database',
    tiles: 'installations_geothermie_surface_echangeurs_fermes_tiles',
  },
  installationsGeothermieSurfaceEchangeursOuverts: {
    compressedTiles: true,
    source: 'database',
    tiles: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
  },
  ouvragesGeothermieSurfaceEchangeursFermes: {
    compressedTiles: true,
    source: 'database',
    tiles: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
  },
  ouvragesGeothermieSurfaceEchangeursOuverts: {
    compressedTiles: true,
    source: 'database',
    tiles: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
  },
  perimetresDeDeveloppementPrioritaire: {
    compressedTiles: true,
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    tiles: 'zone_de_developpement_prioritaire_tiles',
  },
  perimetresGeothermieProfonde: {
    compressedTiles: true,
    source: 'database',
    tiles: 'perimetres_geothermie_profonde_tiles',
  },
  quartiersPrioritairesPolitiqueVille2015anru: {
    compressedTiles: true,
    source: 'database',
    tiles: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
  },
  quartiersPrioritairesPolitiqueVille2024: {
    compressedTiles: true,
    source: 'database',
    tiles: 'quartiers_prioritaires_politique_ville_2024_tiles',
  },
  reseauxDeChaleur: {
    airtable: Airtable.NETWORKS,
    compressedTiles: true,
    source: 'database',
    table: 'reseaux_de_chaleur',
    tiles: 'reseaux_de_chaleur_tiles',
  },
  reseauxDeFroid: {
    airtable: Airtable.COLD_NETWORKS,
    compressedTiles: true,
    source: 'database',
    table: 'reseaux_de_froid',
    tiles: 'reseaux_de_froid_tiles',
  },
  reseauxEnConstruction: {
    airtable: Airtable.FUTUR_NETWORKS,
    compressedTiles: true,
    source: 'database',
    table: 'zones_et_reseaux_en_construction',
    tiles: 'zones_et_reseaux_en_construction_tiles',
  },
  ressourcesGeothermalesNappes: {
    compressedTiles: true,
    source: 'database',
    tiles: 'ressources_geothermales_nappes_tiles',
  },
  testsAdresses: {
    compressedTiles: true,
    source: 'database',
    tiles: 'pro_eligibility_tests_addresses_tiles',
  },
  zonesAUrbaniser: {
    compressedTiles: true,
    source: 'database',
    tiles: 'zone_a_urbaniser_tiles',
  },
  zonesPotentielChaud: {
    compressedTiles: true,
    source: 'database',
    tiles: 'zone_a_potentiel_chaud_tiles',
  },
  zonesPotentielFortChaud: {
    compressedTiles: true,
    source: 'database',
    tiles: 'zone_a_potentiel_fort_chaud_tiles',
  },
  zonesPotentielFortFroid: {
    compressedTiles: true,
    source: 'database',
    tiles: 'zone_a_potentiel_fort_froid_tiles',
  },
  zonesPotentielFroid: {
    compressedTiles: true,
    source: 'database',
    tiles: 'zone_a_potentiel_froid_tiles',
  },
  /**
   * Pour tout ajout de nouvelles couches de données :
   * - bien noter les étapes dans notion https://www.notion.so/D-veloppement-e8399345919442748735de25865ebe4a pour que d'autres personnes puissent reconstruire les données
   * - ajouter une section ici pour faire le lien URL (SourceId) -> table contenant les tuiles
   * - définir la couche et les layers dans map-layers.ts
   * - compléter layerURLKeysToMapConfigPath (carte.tsx) pour pouvoir afficher la couche directement via l'URL
   * - définir les comportements au survol et/ou au clic (en général popup) si besoin dans map-hover.tsx
   * - ajouter un type de popup (dynamique = propre à chaque entité) dans DynamicMapPopupContent
   */
};
