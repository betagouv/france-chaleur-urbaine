import { Knex } from 'knex';
import { Airtable } from 'src/types/enum/Airtable';
import { z } from 'zod';

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
  airtable?: string;
};

export type TileInfo = AirtableTileInfo | DatabaseTileInfo;

export const dataTypes = [
  'network',
  'gas',
  'energy',
  'zoneDP',
  'raccordements',
  'demands',
  'buildings',
  'futurNetwork',
  'coldNetwork',
] as const;

export const zDataType = z.enum(dataTypes);
export type DataType = z.infer<typeof zDataType>;

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

export const preTable: (region: string) => Record<string, string> = (
  region
) => ({
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

export const tilesInfo: Record<DataType, TileInfo> = {
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
    properties: ['id_fcu', 'mise_en_service', 'gestionnaire', 'is_zone'],
    sourceLayer: 'futurOutline',
  },
  coldNetwork: {
    source: 'database',
    table: 'reseaux_de_froid',
    tiles: 'reseaux_de_froid_tiles',
    airtable: Airtable.COLD_NETWORKS,
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'Taux EnR&R',
      'Gestionnaire',
      'Identifiant reseau',
      'reseaux classes',
      'contenu CO2 ACV',
      'nom_reseau',
      'livraisons_totale_MWh',
      'nb_pdl',
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
