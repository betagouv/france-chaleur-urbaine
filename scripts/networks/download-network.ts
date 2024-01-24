import { FieldSet } from 'airtable/lib/field_set';
import { Record } from 'airtable';
import db from 'src/db';
import base from 'src/db/airtable';
import {
  DataType,
  DatabaseTileInfo,
  tilesInfo,
} from 'src/services/tiles.config';
import { parentLogger } from '@helpers/logger';

const TypeArray: unique symbol = Symbol('array');
const TypeBool: unique symbol = Symbol('bool');
const TypeJSONArray: unique symbol = Symbol('json');
const TypeNumber: unique symbol = Symbol('number');
const TypeString: unique symbol = Symbol('string');

type Type =
  | typeof TypeArray
  | typeof TypeBool
  | typeof TypeJSONArray
  | typeof TypeNumber
  | typeof TypeString;

const conversionConfigReseauxDeChaleur = {
  // id_fcu: TypeNumber,
  // id: TypeNumber,
  'Identifiant reseau': TypeString,
  commentaires: TypeString, // à supprimer en prod car non utilisé
  'Taux EnR&R': TypeNumber,
  Gestionnaire: TypeString,
  communes: TypeString,
  // date: TypeString, // à supprimer en prod car non utilisé
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  PM: TypeNumber,
  'PV%': TypeNumber,
  'PF%': TypeNumber,
  PM_L: TypeNumber,
  PM_T: TypeNumber,
  'Rend%': TypeNumber,
  reseaux_techniques: TypeBool,
  nom_reseau: TypeString,
  departement: TypeNumber,
  region: TypeString,
  MO: TypeString,
  adresse_mo: TypeString,
  CP_MO: TypeString,
  ville_mo: TypeString,
  annee_creation: TypeNumber,
  adresse_gestionnaire: TypeString,
  CP_gestionnaire: TypeString,
  ville_gestionnaire: TypeString,
  longueur_reseau: TypeNumber,
  nb_pdl: TypeNumber,
  prod_MWh_gaz_naturel: TypeNumber,
  prod_MWh_charbon: TypeNumber,
  prod_MWh_fioul_domestique: TypeNumber,
  prod_MWh_fioul_lourd: TypeNumber,
  prod_MWh_GPL: TypeNumber,
  prod_MWh_biomasse_solide: TypeNumber,
  prod_MWh_dechets_internes: TypeNumber,
  prod_MWh_UIOM: TypeNumber,
  prod_MWh_biogaz: TypeNumber,
  prod_MWh_geothermie: TypeNumber,
  prod_MWh_PAC_ENR: TypeNumber,
  prod_MWh_PAC_nonENR: TypeNumber,
  prod_MWh_solaire_thermique: TypeNumber,
  prod_MWh_chaleur_industiel: TypeNumber,
  prod_MWh_autre_chaleur_recuperee_ENR: TypeNumber,
  prod_MWh_autre_chaleur_recuperee_nonENR: TypeNumber,
  prod_MWh_chaudieres_electriques: TypeNumber,
  prod_MWh_autre_RCU_ENR: TypeNumber,
  prod_MWh_autre_RCU_nonENR: TypeNumber,
  prod_MWh_autres_ENR: TypeNumber,
  prod_MWh_autres_nonENR: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  '%_fluide_caloporteur_eau_chaude': TypeNumber,
  '%_fluide_caloporteur_eau_surchauffee': TypeNumber,
  '%_fluide_caloporteur_vapeur': TypeNumber,
  production_totale_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  'reseaux classes': TypeBool,
  website_gestionnaire: TypeString,
  has_trace: TypeBool,
  informationsComplementaires: TypeString,
  fichiers: TypeJSONArray,
} as const;

const conversionConfigReseauxDeFroid = {
  // id_fcu: TypeNumber,
  'Identifiant reseau': TypeString,
  // id: TypeNumber,
  'Taux EnR&R': TypeNumber,
  Gestionnaire: TypeString,
  communes: TypeString,
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  nom_reseau: TypeString,
  departement: TypeNumber,
  region: TypeString,
  MO: TypeString,
  adresse_mo: TypeString,
  annee_creation: TypeNumber,
  ville_mo: TypeString,
  adresse_gestionnaire: TypeString,
  ville_gestionnaire: TypeString,
  longueur_reseau: TypeNumber,
  nb_pdl: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  production_totale_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  'reseaux classes': TypeBool,
  website_gestionnaire: TypeString,
  CP_MO: TypeString,
  CP_gestionnaire: TypeString,
  informationsComplementaires: TypeString,
  fichiers: TypeJSONArray,
} as const;

const conversionConfigAutres = {
  mise_en_service: TypeString,
  gestionnaire: TypeString,
  communes: TypeString,
  is_zone: TypeBool,
} as const;

/**
 * Synchronise les données d'une table réseau dans Airtable vers la table correspondante dans Postgres.
 */
export const downloadNetwork = async (table: DataType) => {
  const tileInfo = tilesInfo[table] as DatabaseTileInfo;
  if (!tileInfo || !tileInfo.airtable) {
    throw new Error(`${table} not managed`);
  }

  const networks = await base(tileInfo.airtable).select().all();

  const logger = parentLogger.child({
    table: table,
    count: networks.length,
  });
  const startTime = Date.now();
  logger.info('start network update');
  await Promise.all(
    networks.map((network) =>
      db(tileInfo.table)
        .update(convertEntityFromAirtableToPostgres(table, network))
        .where('id_fcu', network.get('id_fcu'))
    )
  );
  logger.info('end network update', {
    duration: Date.now() - startTime,
  });
};

/**
 * Convertit un réseau Airtable au format Postgres.
 * Les noms de colonne sont identiques, seuls les types sont corrigés et nettoyés.
 */
function convertEntityFromAirtableToPostgres(
  type: DataType,
  airtableNetwork: Record<FieldSet>
) {
  const conversionConfig =
    type === 'network'
      ? conversionConfigReseauxDeChaleur
      : type === 'coldNetwork'
      ? conversionConfigReseauxDeFroid
      : conversionConfigAutres;

  return Object.entries(conversionConfig).reduce((acc, [key, type]) => {
    acc[key] = convertAirtableValue(airtableNetwork.get(key), type);
    return acc;
  }, {} as any);
}

/**
 * Convertit et corrige le potentiel mauvais typage côté Airtable.
 */
function convertAirtableValue(value: any, type: Type) {
  switch (type) {
    case TypeArray:
      return value instanceof Array ? value : [];
    case TypeBool:
      return value !== undefined && value !== null ? !!value : false;
    case TypeJSONArray:
      return value !== undefined && value !== null
        ? JSON.stringify(value)
        : '[]';
    case TypeNumber:
      return value !== undefined && value !== null && value !== 'NULL'
        ? value
        : null;
    case TypeString:
      return value !== undefined && value !== null && value !== 'NULL'
        ? value
        : '';
  }
}
