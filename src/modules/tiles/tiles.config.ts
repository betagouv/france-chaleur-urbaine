import type { Knex } from 'knex';
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
  table: string;
  properties: string[];
  sourceLayer: string;
};

export type AirtableTileInfo = BasicTileInfo & {
  source: 'airtable';
};

export type DatabaseTileInfo = BasicTileInfo & {
  source: 'database';
  tiles: string;
  compressedTiles?: boolean;
  extraWhere: (query: Knex.QueryBuilder) => Knex.QueryBuilder;
  id: string;
  airtable?: string;
};

export type TileInfo = AirtableTileInfo | DatabaseTileInfo;

// = id passé en URL de l'API
export const databaseSourceIds = [
  'network', // réseaux de chaud
  'zoneDP', // zones de développement prioritaire
  'futurNetwork', // réseaux de chaleur en construction
  'coldNetwork', // réseaux de froid
  'demands', // demandes d'éligibilité
  'consommationsGaz',
  'energy', // batiments collectifs chauffés au fioul / gas
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
  'buildings', // caractéristiques des bâtiments
  'etudesEnCours',
  'testsAdresses',
  'zonesAUrbaniser',
  'ressourcesGeothermalesNappes',
  'bdnbBatiments', // nouvelle couche BDNB
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

const bnbFields = `
  id as id,
  libelle_adr_principale_ban AS addr_label,
  ffo_bat_annee_construction AS annee_construction,
  ffo_bat_usage_niveau_1_txt AS type_usage,
  ffo_bat_nb_log AS nb_logements,
  dpe_mix_arrete_type_installation_chauffage AS type_chauffage,
  dpe_mix_arrete_type_energie_chauffage AS energie_utilisee,
  dpe_mix_arrete_classe_bilan_dpe AS dpe_energie,
  dpe_mix_arrete_classe_emission_ges AS dpe_ges
`;

export const preTable: (region: string) => Record<string, string> = (region) => ({
  'pre-table-buildings': `
    SELECT ${bnbFields}, geom
    FROM "${region}"
    WHERE libelle_adr_principale_ban is not null
    `,
  'pre-table-energy': `
    SELECT ${bnbFields}, geom_adresse as geom
    FROM "${region}"
    WHERE libelle_adr_principale_ban is not null
      AND dpe_mix_arrete_type_installation_chauffage = 'collectif'
      AND (
        dpe_mix_arrete_type_energie_chauffage = 'gaz'
        OR dpe_mix_arrete_type_energie_chauffage = 'fioul'
      )`,
});

export const tilesInfo: Record<DatabaseSourceId, TileInfo> = {
  // https://www.notion.so/D-veloppement-e8399345919442748735de25865ebe4a?pvs=4#122c2b5c414b80838207d4f930c68cd7
  batimentsRaccordesReseauxChaleurFroid: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'batiments_raccordes_reseaux_chaleur_froid_tiles', // contient 2 layers batiments_raccordes_reseaux_chaleur et batiments_raccordes_reseaux_froid
  },
  bdnbBatiments: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'bdnb_batiments_tiles',
  },
  besoinsEnChaleur: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'besoins_en_chaleur_tiles',
  },
  besoinsEnChaleurIndustrieCommunes: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'besoins_en_chaleur_industrie_communes_tiles',
  },
  buildings: {
    extraWhere: (query) => query,
    id: 'id',
    properties: [
      'id',
      'nb_logements',
      'annee_construction',
      'type_usage',
      'energie_utilisee',
      'type_chauffage',
      'addr_label',
      'dpe_energie',
      'dpe_ges',
    ],
    source: 'database',
    sourceLayer: 'buildings',
    table: 'pre-table-buildings',
    tiles: 'bnb - batiment_tiles',
  },
  coldNetwork: {
    airtable: Airtable.COLD_NETWORKS,
    extraWhere: (query) => query,
    id: 'id_fcu',
    properties: [
      'id_fcu',
      'Taux EnR&R',
      'Gestionnaire',
      'Identifiant reseau',
      'reseaux classes',
      'contenu CO2 ACV',
      'nom_reseau',
      'livraisons_totale_MWh',
      'nb_pdl',
      'has_trace',
    ],
    source: 'database',
    sourceLayer: 'coldOutline',
    table: 'reseaux_de_froid',
    tiles: 'reseaux_de_froid_tiles',
  },
  communesFortPotentielPourCreationReseauxChaleur: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
  },
  consommationsGaz: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'donnees_de_consos_tiles',
  },
  demands: {
    properties: ['Mode de chauffage', 'Adresse', 'Type de chauffage', 'Structure'],
    source: 'airtable',
    sourceLayer: 'demands',
    table: Airtable.DEMANDES,
  },
  energy: {
    extraWhere: (query) => query,
    id: 'id',
    properties: [
      'id',
      'nb_logements',
      'annee_construction',
      'type_usage',
      'energie_utilisee',
      'type_chauffage',
      'addr_label',
      'dpe_energie',
      'dpe_ges',
    ],
    source: 'database',
    sourceLayer: 'energy',
    table: 'pre-table-energy',
    tiles: 'bnb - adresse_tiles',
  },
  enrrMobilisables: {
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'enrr_mobilisables_tiles',
  },
  'enrrMobilisables-friches': {
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'enrr_mobilisables_friches_tiles',
  },
  'enrrMobilisables-parkings': {
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'enrr_mobilisables_parkings_tiles',
  },
  'enrrMobilisables-thalassothermie': {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'enrr_mobilisables_thalassothermie_tiles',
  },
  'enrrMobilisables-zonesGeothermieProfonde': {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
  },
  etudesEnCours: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'etudes_en_cours_tiles',
  },
  futurNetwork: {
    airtable: Airtable.FUTUR_NETWORKS,
    extraWhere: (query) => query,
    id: 'id_fcu',
    properties: ['id_fcu', 'nom_reseau', 'mise_en_service', 'gestionnaire', 'is_zone', 'tags'],
    source: 'database',
    sourceLayer: 'futurOutline',
    table: 'zones_et_reseaux_en_construction',
    tiles: 'zones_et_reseaux_en_construction_tiles',
  },
  installationsGeothermieProfonde: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'installations_geothermie_profonde_tiles',
  },
  installationsGeothermieSurfaceEchangeursFermes: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'installations_geothermie_surface_echangeurs_fermes_tiles',
  },
  installationsGeothermieSurfaceEchangeursOuverts: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
  },
  network: {
    airtable: Airtable.NETWORKS,
    extraWhere: (query) => query,
    id: 'id_fcu',
    properties: [
      'id_fcu',
      'Taux EnR&R',
      'Gestionnaire',
      'Identifiant reseau',
      'reseaux classes',
      'contenu CO2 ACV',
      'nom_reseau',
      'livraisons_totale_MWh',
      'nb_pdl',
      'has_trace',
      'PM',
      'annee_creation',
    ],
    source: 'database',
    sourceLayer: 'outline-solid',
    table: 'reseaux_de_chaleur',
    tiles: 'reseaux_de_chaleur_tiles',
  },
  ouvragesGeothermieSurfaceEchangeursFermes: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
  },
  ouvragesGeothermieSurfaceEchangeursOuverts: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
  },
  perimetresGeothermieProfonde: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'perimetres_geothermie_profonde_tiles',
  },
  quartiersPrioritairesPolitiqueVille2015anru: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
  },
  quartiersPrioritairesPolitiqueVille2024: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'quartiers_prioritaires_politique_ville_2024_tiles',
  },
  ressourcesGeothermalesNappes: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'ressources_geothermales_nappes_tiles',
  },
  testsAdresses: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'pro_eligibility_tests_addresses_tiles',
  },
  zoneDP: {
    extraWhere: (query) => query,
    id: 'id_fcu',
    properties: ['id_fcu', 'Identifiant reseau'],
    source: 'database',
    sourceLayer: 'zoneDP',
    table: 'zone_de_developpement_prioritaire',
    tiles: 'zone_de_developpement_prioritaire_tiles',
  },
  zonesAUrbaniser: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'zone_a_urbaniser_tiles',
  },
  zonesPotentielChaud: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'zone_a_potentiel_chaud_tiles',
  },
  zonesPotentielFortChaud: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'zone_a_potentiel_fort_chaud_tiles',
  },
  zonesPotentielFortFroid: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
    tiles: 'zone_a_potentiel_fort_froid_tiles',
  },
  zonesPotentielFroid: {
    compressedTiles: true,
    extraWhere: (query) => query, // useless
    id: '', // useless
    properties: [], // useless
    source: 'database',
    sourceLayer: '', // useless
    table: '', // useless
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
