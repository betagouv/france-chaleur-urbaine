import { Knex } from 'knex';

type BasicTileInfo = {
  table: string;
  minZoom?: boolean;
  properties: string[];
  sourceLayer: string;
};

export type AirtableTileInfo = BasicTileInfo & {
  source: 'airtable';
};

export type DatabaseTileInfo = BasicTileInfo & {
  source: 'database';
  tiles: string;
  extraWhere: (query: Knex.QueryBuilder) => Knex.QueryBuilder;
  id: string;
};

export type TileInfo = AirtableTileInfo | DatabaseTileInfo;

export type DataType =
  | 'network'
  | 'gas'
  | 'energy'
  | 'zoneDP'
  | 'demands'
  | 'buildings';

export const preTable: Record<string, string> = {
  'pre-table-energy': `
    SELECT rowid as id, geom_adresse AS geom,
      etaban202111_label AS addr_label,
      cerffo2020_annee_construction AS annee_construction,
      CASE
        WHEN cerffo2020_nb_log ISNULL 
          THEN anarnc202012_nb_log
        WHEN cerffo2020_nb_log < 1 
          THEN anarnc202012_nb_log
        ELSE cerffo2020_nb_log
      END nb_logements,
      adedpe202006_logtype_ch_type_ener_corr AS energie_utilisee,
      adedpe202006_mean_class_conso_ener AS dpe_energie,
      adedpe202006_mean_class_estim_ges AS dpe_ges
    FROM "bnb_idf - batiment_adresse"
    WHERE geom IS NOT NULL
      AND bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND adedpe202006_logtype_ch_type_inst = 'collectif'
      AND (
        adedpe202006_logtype_ch_type_ener_corr = 'gaz'
        OR adedpe202006_logtype_ch_type_ener_corr = 'fioul'
      )`,
  'pre-table-buildings': `
    SELECT rowid as id, geom AS geom,
      etaban202111_label AS addr_label,
      cerffo2020_annee_construction AS annee_construction,
      cerffo2020_usage_niveau_1_txt AS type_usage,
      CASE
        WHEN cerffo2020_nb_log ISNULL 
          THEN anarnc202012_nb_log
        WHEN cerffo2020_nb_log < 1 
          THEN anarnc202012_nb_log
        ELSE cerffo2020_nb_log
      END nb_logements,
      adedpe202006_logtype_ch_type_inst AS type_chauffage,
      CASE
        WHEN adedpe202006_logtype_ch_type_ener_corr <> '' 
          THEN adedpe202006_logtype_ch_type_ener_corr
        ELSE adedpe202006_logtype_ch_gen_lib_princ
      END energie_utilisee,
      adedpe202006_mean_class_conso_ener AS dpe_energie,
      adedpe202006_mean_class_estim_ges AS dpe_ges
    FROM "bnb_idf - batiment_adresse"
    WHERE geom IS NOT NULL
    AND bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
    `,
};

export const tilesInfo: Record<string, TileInfo> = {
  demands: {
    source: 'airtable',
    table: 'FCU - Utilisateurs',
    properties: ['Mode de chauffage', 'Adresse'],
    sourceLayer: 'demands',
  },
  network: {
    source: 'database',
    table: 'reseaux_de_chaleur',
    tiles: 'reseaux_de_chaleur_tiles',
    id: 'id',
    extraWhere: (query) => query,
    properties: ['id'],
    sourceLayer: 'outline',
  },
  zoneDP: {
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    tiles: 'zone_de_developpement_prioritaire_tiles',
    id: 'id',
    extraWhere: (query) => query,
    properties: ['id'],
    sourceLayer: 'zoneDP',
  },
  buildings: {
    source: 'database',
    table: 'pre-table-buildings',
    tiles: 'bnb_idf - batiment_tiles',
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
    tiles: 'bnb_idf - adresse_tiles',
    minZoom: true,
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'nb_logements',
      'annee_construction',
      'energie_utilisee',
      'addr_label',
    ],
    sourceLayer: 'energy',
  },
  gas: {
    source: 'database',
    table: 'Donnees_de_conso_et_pdl_gaz_nat_2020',
    tiles: 'Donnees_de_conso_et_pdl_gaz_nat_2020_tiles',
    minZoom: true,
    id: 'rownum',
    extraWhere: (query) => query.whereIn('code_grand', ['R', 'T', 'I']),
    properties: ['rownum', 'code_grand', 'conso_nb', 'adresse', 'pdl_nb'],
    sourceLayer: 'gasUsage',
  },
};
