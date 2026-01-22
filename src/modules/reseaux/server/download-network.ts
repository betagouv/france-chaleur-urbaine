import type { Record } from 'airtable';
import type { FieldSet } from 'airtable/lib/field_set';

import { type AirtableSynchronizableNetworkTable, airtableSynchronizableNetworkTableConfig } from '@/modules/reseaux/constants';
import type { DatabaseSourceId } from '@/modules/tiles/tiles.config';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

export const TypeArray: unique symbol = Symbol('array');
export const TypeBool: unique symbol = Symbol('bool');
export const TypeJSONArray: unique symbol = Symbol('json');
export const TypeNumber: unique symbol = Symbol('number');
export const TypePercentage: unique symbol = Symbol('percentage');
export const TypeString: unique symbol = Symbol('string');
export const TypeStringToArray: unique symbol = Symbol('array');

export type Type =
  | typeof TypeArray
  | typeof TypeBool
  | typeof TypeJSONArray
  | typeof TypeNumber
  | typeof TypePercentage
  | typeof TypeString
  | typeof TypeStringToArray;

const conversionConfigReseauxDeChaleur = {
  // departement: TypeString,
  // region: TypeString,
  adresse_mo: TypeString,
  annee_creation: TypeNumber,
  CP_MO: TypeString,
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  'Dev_reseau%': TypeNumber,
  eau_chaude: TypeString,
  eau_surchauffee: TypeString,
  fichiers: TypeJSONArray,
  Gestionnaire: TypeString,
  has_PDP: TypeBool,
  // id_fcu: TypeNumber,
  // id: TypeNumber,
  'Identifiant reseau': TypeString,
  informationsComplementaires: TypeString,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  longueur_reseau: TypeNumber,
  // communes: TypeStringToArray,
  MO: TypeString,
  'Moyenne-annee-DPE': TypeString,
  nb_pdl: TypeNumber,
  nom_reseau: TypeString,
  ouvert_aux_raccordements: TypeBool,
  'PF%': TypeNumber,
  PM: TypeNumber,
  PM_L: TypeNumber,
  PM_T: TypeNumber,
  'PV%': TypeNumber,
  prod_MWh_autre_chaleur_recuperee: TypeNumber,
  prod_MWh_autres: TypeNumber,
  prod_MWh_autres_ENR: TypeNumber,
  prod_MWh_biogaz: TypeNumber,
  prod_MWh_biomasse_solide: TypeNumber,
  prod_MWh_chaleur_industiel: TypeNumber,
  prod_MWh_charbon: TypeNumber,
  prod_MWh_chaudieres_electriques: TypeNumber,
  prod_MWh_dechets_internes: TypeNumber,
  prod_MWh_fioul_domestique: TypeNumber,
  prod_MWh_fioul_lourd: TypeNumber,
  prod_MWh_GPL: TypeNumber,
  prod_MWh_gaz_naturel: TypeNumber,
  prod_MWh_geothermie: TypeNumber,
  prod_MWh_PAC: TypeNumber,
  prod_MWh_solaire_thermique: TypeNumber,
  prod_MWh_UIOM: TypeNumber,
  production_totale_MWh: TypeNumber,
  puissance_MW_autre_chaleur_recuperee: TypeNumber,
  puissance_MW_autres: TypeNumber,
  puissance_MW_autres_ENR: TypeNumber,
  puissance_MW_biogaz: TypeNumber,
  puissance_MW_biomasse_solide: TypeNumber,
  puissance_MW_chaleur_industiel: TypeNumber,
  puissance_MW_charbon: TypeNumber,
  puissance_MW_chaudieres_electriques: TypeNumber,
  puissance_MW_dechets_internes: TypeNumber,
  puissance_MW_fioul_domestique: TypeNumber,
  puissance_MW_fioul_lourd: TypeNumber,
  puissance_MW_GPL: TypeNumber,
  puissance_MW_gaz_naturel: TypeNumber,
  puissance_MW_geothermie: TypeNumber,
  puissance_MW_PAC: TypeNumber,
  puissance_MW_solaire_thermique: TypeNumber,
  puissance_MW_UIOM: TypeNumber,
  puissance_totale_MW: TypeNumber,
  'Rend%': TypeNumber,
  //has_trace: TypeBool,
  // date_actualisation_trace: TypeString,
  // date_actualisation_pdp: TypeString,
  //'non ref 2022': TypeBool,
  'reseaux classes': TypeBool,
  reseaux_techniques: TypeBool,
  'Taux EnR&R': TypeNumber,
  vapeur: TypeString,
  ville_mo: TypeString,
  website_gestionnaire: TypeString,
} as const;

const conversionConfigReseauxDeFroid = {
  adresse_mo: TypeString,
  annee_creation: TypeNumber,
  CP_MO: TypeString,
  // communes: TypeStringToArray,
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  fichiers: TypeJSONArray,
  Gestionnaire: TypeString,
  // id_fcu: TypeNumber,
  'Identifiant reseau': TypeString,
  informationsComplementaires: TypeString,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  longueur_reseau: TypeNumber,
  // departement: TypeString,
  // region: TypeString,
  MO: TypeString,
  'Moyenne-annee-DPE': TypeString,
  nb_pdl: TypeNumber,
  nom_reseau: TypeString,
  production_totale_MWh: TypeNumber,
  puissance_totale_MW: TypeNumber,
  'Rend%': TypeNumber,
  'reseaux classes': TypeBool,
  //'non ref 2022': TypeBool,
  //has_trace: TypeBool,
  // date_actualisation_trace: TypeString,
  'Taux EnR&R': TypeNumber,
  ville_mo: TypeString,
  website_gestionnaire: TypeString,
} as const;

const conversionConfigReseauxEnConstruction = {
  gestionnaire: TypeString,
  mise_en_service: TypeString,
  nom_reseau: TypeString,
  ouvert_aux_raccordements: TypeBool,
  // date_actualisation_trace: TypeString,
  // communes: TypeStringToArray,
  // is_zone: TypeBool,
} as const;

/**
 * Synchronise les données d'une table réseau dans Airtable vers la table correspondante dans Postgres.
 */
export const downloadNetwork = async (table: AirtableSynchronizableNetworkTable) => {
  const networksAirtable = await AirtableDB(airtableSynchronizableNetworkTableConfig[table].airtable).select().all();

  const logger = parentLogger.child({
    count: networksAirtable.length,
    table,
  });
  const startTime = Date.now();
  logger.info('start network update');
  await Promise.all(
    networksAirtable.map(async (network) => {
      const idFcu = network.get('id_fcu') as number | undefined;
      if (idFcu) {
        await kdb
          .updateTable(airtableSynchronizableNetworkTableConfig[table].table)
          .set(convertEntityFromAirtableToPostgres(table, network))
          .where('id_fcu', '=', idFcu)
          .execute();
      }
    })
  );
  logger.info('end network update', {
    duration: Date.now() - startTime,
  });
};

/**
 * Convertit un réseau Airtable au format Postgres.
 * Les noms de colonne sont identiques, seuls les types sont corrigés et nettoyés.
 */
function convertEntityFromAirtableToPostgres(type: DatabaseSourceId, airtableNetwork: Record<FieldSet>) {
  const conversionConfig =
    type === 'reseauxDeChaleur'
      ? conversionConfigReseauxDeChaleur
      : type === 'reseauxDeFroid'
        ? conversionConfigReseauxDeFroid
        : conversionConfigReseauxEnConstruction;

  return Object.entries(conversionConfig).reduce((acc, [key, type]) => {
    acc[key] = convertAirtableValue(airtableNetwork.get(key), type);
    return acc;
  }, {} as any);
}

/**
 * Convertit et corrige le potentiel mauvais typage côté Airtable.
 */
export function convertAirtableValue(value: any, type: Type) {
  switch (type) {
    case TypeArray:
      return Array.isArray(value) ? value : [];
    case TypeBool:
      return value !== undefined && value !== null ? !!value : false;
    case TypeJSONArray:
      return value !== undefined && value !== null ? JSON.stringify(value) : '[]';
    case TypeNumber:
      return value !== undefined && value !== null && value !== 'NULL' ? value : null;
    case TypePercentage:
      return value !== undefined && value !== null && value !== 'NULL'
        ? value * 100 // be compatible with number and text
        : null;
    case TypeString:
      return value !== undefined && value !== null && value !== 'NULL' ? value : null;
    case TypeStringToArray:
      return value !== undefined && value !== null && value !== 'NULL' ? value.split(',') : [];
    default:
      throw new Error(`invalid type ${type}`);
  }
}
