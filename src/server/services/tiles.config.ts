import { type Knex } from 'knex';
import { z } from 'zod';

import { type buildingsDataExtractionPolygonsSourceId } from '@/components/Map/components/tools/BuildingsDataExtractionTool';
import {
  type distancesMeasurementLabelsSourceId,
  type distancesMeasurementLinesSourceId,
} from '@/components/Map/components/tools/DistancesMeasurementTool';
import {
  type linearHeatDensityLabelsSourceId,
  type linearHeatDensityLinesSourceId,
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
  'gas', // consommations de gaz
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
  | 'customGeojson';
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
  'pre-table-energy': `
    SELECT ${bnbFields}, geom_adresse as geom
    FROM "${region}"
    WHERE libelle_adr_principale_ban is not null
      AND dpe_mix_arrete_type_installation_chauffage = 'collectif'
      AND (
        dpe_mix_arrete_type_energie_chauffage = 'gaz'
        OR dpe_mix_arrete_type_energie_chauffage = 'fioul'
      )`,
  'pre-table-buildings': `
    SELECT ${bnbFields}, geom
    FROM "${region}"
    WHERE libelle_adr_principale_ban is not null
    `,
});

export const tilesInfo: Record<DatabaseSourceId, TileInfo> = {
  demands: {
    source: 'airtable',
    table: Airtable.DEMANDES,
    properties: ['Mode de chauffage', 'Adresse', 'Type de chauffage', 'Structure'],
    sourceLayer: 'demands',
  },
  // https://www.notion.so/D-veloppement-e8399345919442748735de25865ebe4a?pvs=4#122c2b5c414b80838207d4f930c68cd7
  batimentsRaccordesReseauxChaleurFroid: {
    source: 'database',
    tiles: 'batiments_raccordes_reseaux_chaleur_froid_tiles', // contient 2 layers batiments_raccordes_reseaux_chaleur et batiments_raccordes_reseaux_froid
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  network: {
    source: 'database',
    table: 'reseaux_de_chaleur',
    tiles: 'reseaux_de_chaleur_tiles',
    airtable: Airtable.NETWORKS,
    id: 'id_fcu',
    extraWhere: (query) => query,
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
    sourceLayer: 'outline',
  },
  futurNetwork: {
    source: 'database',
    table: 'zones_et_reseaux_en_construction',
    tiles: 'zones_et_reseaux_en_construction_tiles',
    airtable: Airtable.FUTUR_NETWORKS,
    id: 'id_fcu',
    extraWhere: (query) => query,
    properties: ['id_fcu', 'nom_reseau', 'mise_en_service', 'gestionnaire', 'is_zone', 'tags'],
    sourceLayer: 'futurOutline',
  },
  coldNetwork: {
    source: 'database',
    table: 'reseaux_de_froid',
    tiles: 'reseaux_de_froid_tiles',
    airtable: Airtable.COLD_NETWORKS,
    id: 'id_fcu',
    extraWhere: (query) => query,
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
    sourceLayer: 'coldOutline',
  },
  zoneDP: {
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    tiles: 'zone_de_developpement_prioritaire_tiles',
    id: 'id_fcu',
    extraWhere: (query) => query,
    properties: ['id_fcu', 'Identifiant reseau'],
    sourceLayer: 'zoneDP',
  },
  buildings: {
    source: 'database',
    table: 'pre-table-buildings',
    tiles: 'bnb - batiment_tiles',
    id: 'id',
    extraWhere: (query) => query,
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
    sourceLayer: 'buildings',
  },
  energy: {
    source: 'database',
    table: 'pre-table-energy',
    tiles: 'bnb - adresse_tiles',
    id: 'id',
    extraWhere: (query) => query,
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
    sourceLayer: 'energy',
  },
  gas: {
    source: 'database',
    table: 'donnees_de_consos',
    tiles: 'donnees_de_consos_tiles',
    id: 'rownum',
    extraWhere: (query) => query.whereIn('code_grand', ['R', 'T', 'I']),
    properties: ['rownum', 'code_grand', 'conso_nb', 'adresse', 'nom_commun', 'pdl_nb'],
    sourceLayer: 'gasUsage',
  },
  enrrMobilisables: {
    source: 'database',
    tiles: 'enrr_mobilisables_tiles',
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  'enrrMobilisables-friches': {
    source: 'database',
    tiles: 'enrr_mobilisables_friches_tiles',
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  'enrrMobilisables-parkings': {
    source: 'database',
    tiles: 'enrr_mobilisables_parkings_tiles',
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  'enrrMobilisables-zonesGeothermieProfonde': {
    source: 'database',
    tiles: 'enrr_mobilisables_zones_geothermie_profonde_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  'enrrMobilisables-thalassothermie': {
    source: 'database',
    tiles: 'enrr_mobilisables_thalassothermie_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  installationsGeothermieProfonde: {
    source: 'database',
    tiles: 'installations_geothermie_profonde_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  perimetresGeothermieProfonde: {
    source: 'database',
    tiles: 'perimetres_geothermie_profonde_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  installationsGeothermieSurfaceEchangeursFermes: {
    source: 'database',
    tiles: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  installationsGeothermieSurfaceEchangeursOuverts: {
    source: 'database',
    tiles: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  ouvragesGeothermieSurfaceEchangeursFermes: {
    source: 'database',
    tiles: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  ouvragesGeothermieSurfaceEchangeursOuverts: {
    source: 'database',
    tiles: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  zonesPotentielChaud: {
    source: 'database',
    tiles: 'zone_a_potentiel_chaud_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  zonesPotentielFortChaud: {
    source: 'database',
    tiles: 'zone_a_potentiel_fort_chaud_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  zonesPotentielFroid: {
    source: 'database',
    tiles: 'zone_a_potentiel_froid_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  zonesPotentielFortFroid: {
    source: 'database',
    tiles: 'zone_a_potentiel_fort_froid_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  besoinsEnChaleur: {
    source: 'database',
    tiles: 'besoins_en_chaleur_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  besoinsEnChaleurIndustrieCommunes: {
    source: 'database',
    tiles: 'besoins_en_chaleur_industrie_communes_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  communesFortPotentielPourCreationReseauxChaleur: {
    source: 'database',
    tiles: 'communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  quartiersPrioritairesPolitiqueVille2015anru: {
    source: 'database',
    tiles: 'quartiers_prioritaires_politique_ville_2015_anru_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  quartiersPrioritairesPolitiqueVille2024: {
    source: 'database',
    tiles: 'quartiers_prioritaires_politique_ville_2024_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  etudesEnCours: {
    source: 'database',
    tiles: 'etudes_en_cours_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  testsAdresses: {
    source: 'database',
    tiles: 'pro_eligibility_tests_addresses_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  zonesAUrbaniser: {
    source: 'database',
    tiles: 'zone_a_urbaniser_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
  },
  ressourcesGeothermalesNappes: {
    source: 'database',
    tiles: 'ressources_geothermales_nappes_tiles',
    compressedTiles: true,
    table: '', // useless
    properties: [], // useless
    sourceLayer: '', // useless
    id: '', // useless
    extraWhere: (query) => query, // useless
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
