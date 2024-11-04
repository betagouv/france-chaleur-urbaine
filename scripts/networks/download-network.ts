import { Record } from 'airtable';
import { FieldSet } from 'airtable/lib/field_set';

import { parentLogger } from '@helpers/logger';
import db from 'src/db';
import base from 'src/db/airtable';
import { DatabaseTileInfo, tilesInfo, DatabaseSourceId } from 'src/services/tiles.config';

const TypeArray: unique symbol = Symbol('array');
const TypeBool: unique symbol = Symbol('bool');
const TypeJSONArray: unique symbol = Symbol('json');
const TypeNumber: unique symbol = Symbol('number');
const TypePercentage: unique symbol = Symbol('percentage');
const TypeString: unique symbol = Symbol('string');
const TypeStringToArray: unique symbol = Symbol('array');

type Type =
  | typeof TypeArray
  | typeof TypeBool
  | typeof TypeJSONArray
  | typeof TypeNumber
  | typeof TypePercentage
  | typeof TypeString
  | typeof TypeStringToArray;

const conversionConfigReseauxDeChaleur = {
  // id_fcu: TypeNumber,
  // id: TypeNumber,
  'Identifiant reseau': TypeString,
  //has_trace: TypeBool,
  //'non ref 2022': TypeBool,
  'reseaux classes': TypeBool,
  has_PDP: TypeBool,
  nom_reseau: TypeString,
  communes: TypeStringToArray,
  MO: TypeString,
  Gestionnaire: TypeString,
  'Taux EnR&R': TypeNumber,
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  contenu_CO2_2023_tmp: TypeNumber,
  contenu_CO2_ACV_2023_tmp: TypeNumber,
  PM: TypeNumber,
  'PV%': TypeNumber,
  'PF%': TypeNumber,
  PM_L: TypeNumber,
  PM_T: TypeNumber,
  'Dev_reseau%': TypeNumber,
  'Rend%': TypeNumber,
  reseaux_techniques: TypeBool,
  departement: TypeNumber,
  region: TypeString,
  adresse_mo: TypeString,
  CP_MO: TypeString,
  ville_mo: TypeString,
  annee_creation: TypeNumber,
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
  prod_MWh_PAC: TypeNumber,
  prod_MWh_solaire_thermique: TypeNumber,
  prod_MWh_chaleur_industiel: TypeNumber,
  prod_MWh_autre_chaleur_recuperee: TypeNumber,
  prod_MWh_autres_ENR: TypeNumber,
  prod_MWh_chaudieres_electriques: TypeNumber,
  prod_MWh_autres: TypeNumber,
  production_totale_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  puissance_MW_totale: TypeNumber,
  puissance_MW_gaz_naturel: TypeNumber,
  puissance_MW_charbon: TypeNumber,
  puissance_MW_fioul_domestique: TypeNumber,
  puissance_MW_fioul_lourd: TypeNumber,
  puissance_MW_GPL: TypeNumber,
  puissance_MW_biomasse_solide: TypeNumber,
  puissance_MW_dechets_internes: TypeNumber,
  puissance_MW_UIOM: TypeNumber,
  puissance_MW_biogaz: TypeNumber,
  puissance_MW_geothermie: TypeNumber,
  puissance_MW_PAC: TypeNumber,
  puissance_MW_solaire_thermique: TypeNumber,
  puissance_MW_chaleur_industiel: TypeNumber,
  puissance_MW_autre_chaleur_recuperee: TypeNumber,
  puissance_MW_chaudieres_electriques: TypeNumber,
  puissance_MW_autres: TypeNumber,
  puissance_MW_autres_ENR: TypeNumber,
  eau_chaude: TypeString,
  eau_surchauffee: TypeString,
  vapeur: TypeString,
  website_gestionnaire: TypeString,
  informationsComplementaires: TypeString,
  fichiers: TypeJSONArray,
} as const;

const conversionConfigReseauxDeFroid = {
  // id_fcu: TypeNumber,
  'Identifiant reseau': TypeString,
  nom_reseau: TypeString,
  //'non ref 2022': TypeBool,
  //has_trace: TypeBool,
  'Taux EnR&R': TypeNumber,
  Gestionnaire: TypeString,
  communes: TypeStringToArray,
  contenu_CO2_2023_tmp: TypeNumber,
  contenu_CO2_ACV_2023_tmp: TypeNumber,
  'contenu CO2': TypeNumber,
  'contenu CO2 ACV': TypeNumber,
  departement: TypeNumber,
  region: TypeString,
  MO: TypeString,
  adresse_mo: TypeString,
  annee_creation: TypeNumber,
  ville_mo: TypeString,
  CP_MO: TypeString,
  longueur_reseau: TypeNumber,
  nb_pdl: TypeNumber,
  production_totale_MWh: TypeNumber,
  livraisons_totale_MWh: TypeNumber,
  livraisons_residentiel_MWh: TypeNumber,
  livraisons_tertiaire_MWh: TypeNumber,
  livraisons_industrie_MWh: TypeNumber,
  livraisons_agriculture_MWh: TypeNumber,
  livraisons_autre_MWh: TypeNumber,
  'Rend%': TypeNumber,
  'reseaux classes': TypeBool,
  website_gestionnaire: TypeString,
  informationsComplementaires: TypeString,
  fichiers: TypeJSONArray,
} as const;

const conversionConfigAutres = {
  mise_en_service: TypeString,
  gestionnaire: TypeString,
  communes: TypeStringToArray,
  is_zone: TypeBool,
} as const;

/**
 * Synchronise les données d'une table réseau dans Airtable vers la table correspondante dans Postgres.
 */
export const downloadNetwork = async (table: DatabaseSourceId) => {
  const tileInfo = tilesInfo[table] as DatabaseTileInfo;
  if (!tileInfo || !tileInfo.airtable) {
    throw new Error(`${table} not managed`);
  }
  const networksAirtable = await base(tileInfo.airtable).select().all();

  const logger = parentLogger.child({
    table: table,
    count: networksAirtable.length,
  });
  const startTime = Date.now();
  logger.info('start network update');

  if (table === 'network' || table === 'coldNetwork') {
    const addIds: number[] = [];
    let updateCount = 0;

    const networksDB = await db(tileInfo.table).select('id_fcu', 'communes', 'Identifiant reseau', 'has_trace');
    await Promise.all(
      networksDB.map(async (network) => {
        const networkAirtable = networksAirtable.find((row) => row.get('id_fcu') === network['id_fcu']);
        if (networkAirtable) {
          if (network['has_trace'] !== convertAirtableValue(networkAirtable.get('has_trace'), TypeBool)) {
            updateCount++;
            await base(tileInfo.airtable as string).update(networkAirtable.id, {
              has_trace: network['has_trace'],
            });
          }
        } else {
          addIds.push(network['id_fcu']);
          await base(tileInfo.airtable as string).create(
            [
              {
                fields: {
                  id_fcu: network['id_fcu'],
                  'Identifiant reseau': network['Identifiant reseau'],
                  communes: network['communes'] && network['communes'].toString(),
                  has_trace: network['has_trace'],
                },
              },
            ],
            {
              typecast: true,
            }
          );
        }
      })
    );
    logger.info('', {
      add: addIds.length,
      addIds: addIds.length > 0 ? addIds.toString() : '0',
      update: updateCount,
    });
  } else if (table === 'futurNetwork') {
    const addIds: number[] = [];
    const networksDB = await db(tileInfo.table).select('id_fcu');
    await Promise.all(
      networksDB.map(async (network) => {
        const networkAirtable = networksAirtable.find((row) => row.get('id_fcu') === network['id_fcu']);
        if (!networkAirtable) {
          addIds.push(network['id_fcu']);
          await base(tileInfo.airtable as string).create(
            [
              {
                fields: {
                  id_fcu: network['id_fcu'],
                  communes: network['communes'],
                },
              },
            ],
            {
              typecast: true,
            }
          );
        }
      })
    );
    logger.info('', {
      add: addIds.length,
      addIds: addIds.length > 0 ? addIds.toString() : '0',
    });
  }

  await Promise.all(
    networksAirtable.map(async (network) => {
      if (network.get('id_fcu')) {
        await db(tileInfo.table).update(convertEntityFromAirtableToPostgres(table, network)).where('id_fcu', network.get('id_fcu'));
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
  }
}
