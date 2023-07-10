import { Knex } from 'knex';
import { Airtable } from 'src/types/enum/Airtable';

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
  extraWhere: (query: Knex.QueryBuilder) => Knex.QueryBuilder;
  id: string;
};

export type TileInfo = AirtableTileInfo | DatabaseTileInfo;

export type DataType =
  | 'network'
  | 'gas'
  | 'energy'
  | 'zoneDP'
  | 'raccordements'
  | 'demands'
  | 'buildings';

const bnbFields = `
  fid as id,
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
`;

export const preTable: (region: string) => Record<string, string> = (
  region
) => ({
  'pre-table-energy': `
    SELECT ${bnbFields}, geom_adresse as geom
    FROM "${region}"
    WHERE bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND adedpe202006_logtype_ch_type_inst = 'collectif'
      AND (
        adedpe202006_logtype_ch_type_ener_corr = 'gaz'
        OR adedpe202006_logtype_ch_type_ener_corr = 'fioul'
      )`,
  'pre-table-buildings': `
    SELECT ${bnbFields}, geom
    FROM "${region}"
    WHERE bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
    `,
});

export const tilesInfo: Record<string, TileInfo> = {
  demands: {
    source: 'airtable',
    table: Airtable.UTILISATEURS,
    properties: [
      'Mode de chauffage',
      'Adresse',
      'Type de chauffage',
      'Structure',
    ],
    sourceLayer: 'demands',
  },
  raccordements: {
    source: 'database',
    table: 'batiments_raccordes_rdc',
    tiles: 'raccordements_tiles',
    id: 'fid',
    extraWhere: (query) => query.whereLike('ID', '%C'),
    properties: ['fid', 'ADRESSE', 'CONSO', 'PDL', 'ID'],
    sourceLayer: 'raccordements',
  },
  network: {
    source: 'database',
    table: 'reseaux_de_chaleur',
    tiles: 'reseaux_de_chaleur_tiles',
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'Taux EnR&R',
      'Gestionnaire',
      'commentaires',
      'Identifiant reseau',
      'reseaux classes',
      'contenu CO2 ACV',
      'nom_reseau',
      'livraisons_totale_MWh',
      'nb_pdl',
    ],
    sourceLayer: 'outline',
  },
  futurNetwork: {
    source: 'database',
    table: 'zones_et_reseaux_en_construction',
    tiles: 'zones_et_reseaux_en_construction_tiles',
    id: 'id',
    extraWhere: (query) => query,
    properties: ['id', 'mise_en_service', 'gestionnaire', 'is_zone'],
    sourceLayer: 'futurOutline',
  },
  coldNetwork: {
    source: 'database',
    table: 'reseaux_de_froid',
    tiles: 'reseaux_de_froid_tiles',
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'Taux EnR&R',
      'Gestionnaire',
      'Identifiant reseau',
      'reseaux classes',
      'contenu CO2 ACV',
    ],
    sourceLayer: 'coldOutline',
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
    properties: [
      'rownum',
      'code_grand',
      'conso_nb',
      'adresse',
      'nom_commun',
      'pdl_nb',
    ],
    sourceLayer: 'gasUsage',
  },
};
