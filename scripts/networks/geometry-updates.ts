import { type Knex } from 'knex';
import { createLogger, format, transports } from 'winston';

import db from '@/server/db';
import { AirtableDB, type AirtableTable } from '@/server/db/airtable';

import { type Type, TypeBool, TypeString } from './download-network';

// pour juste logger et ne pas faire les opérations
let globalDryRun = false;

// 2 loggers pour conserver la traces sur la console et dans des fichiers

const logger = createLogger({
  level: 'debug',
  format: format.printf(({ level, message }) => {
    return level === 'error' ? `*** ERROR ***: ${message}` : level === 'warn' ? `* WARN *: ${message}` : message;
  }),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'changements_données_tracées.log',
      options: { flags: 'w' }, // truncate
    }),
  ],
});

const queriesLogger = createLogger({
  level: 'debug',
  format: format.printf(({ level, message }) => {
    return level === 'error' ? `*** ERROR ***: ${message}` : message;
  }),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'changements_données_tracées_queries.log',
      options: { flags: 'w' }, // truncate
    }),
  ],
});

type PostgresConfig = {
  getCreateProps?: (changement: Changement) => object;
  getUpdateProps: (changement: Changement) => object;
};

type AirtableConfig = {
  tableName: AirtableTable;
  createSearchFormula?: (changement: Changement) => string;
  getCreateProps: (changement: Changement) => object;
  getUpdateProps: (changement: Changement) => object;
  fieldsConversion: Record<string, Type>;
};

type TableConfig = {
  tableChangements: string;
  tableChangementsSelectFields?: string[];
  pgToAirtableSyncAdditionalFields?: string[];
  tableCible: string;
  postgres?: PostgresConfig;
  airtable?: AirtableConfig;
};

// Cette configuration permet de mettre à jour chaque type de données avec ses spécificités
export const tableConfigs: TableConfig[] = [
  {
    tableCible: 'public.reseaux_de_chaleur',
    tableChangements: 'wip_traces.changements_reseaux_de_chaleur',
    tableChangementsSelectFields: ['id_sncu_new as id_sncu'],
    pgToAirtableSyncAdditionalFields: ['has_PDP'],
    postgres: {
      getCreateProps: (changement) => ({
        'Identifiant reseau': changement.id_sncu,
        has_trace: changement.is_line,
        communes: changement.ign_communes,
      }),
      getUpdateProps: (changement) => ({
        has_trace: changement.is_line,
        communes: changement.ign_communes,
      }),
    },
    airtable: {
      tableName: 'FCU - Réseaux de chaleur',
      createSearchFormula: (changement) => `OR(
        FIND(${changement.id_fcu}, {id_fcu}) ${changement.id_sncu ? `, FIND("${changement.id_sncu}", {Identifiant reseau})` : ''}
      )`,
      getCreateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        'Identifiant reseau': changement.id_sncu,
        has_trace: changement.is_line,
        communes: changement.ign_communes.join(','),
      }),
      getUpdateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        has_trace: changement.is_line,
        communes: changement.ign_communes.join(','),
        has_PDP: changement.has_PDP,
      }),
      fieldsConversion: {
        id_fcu: TypeString,
        has_trace: TypeBool,
        communes: TypeString,
        has_PDP: TypeBool,
      },
    },
  },
  {
    tableCible: 'public.reseaux_de_froid',
    tableChangements: 'wip_traces.changements_reseaux_de_froid',
    tableChangementsSelectFields: ['id_sncu_new as id_sncu'],
    postgres: {
      getCreateProps: (changement) => ({
        'Identifiant reseau': changement.id_sncu,
        has_trace: changement.is_line,
        communes: changement.ign_communes,
      }),
      getUpdateProps: (changement) => ({
        has_trace: changement.is_line,
        communes: changement.ign_communes,
      }),
    },
    airtable: {
      tableName: 'FCU - Réseaux de froid',
      createSearchFormula: (changement) => `OR(
        FIND(${changement.id_fcu}, {id_fcu}),
        FIND("${changement.id_sncu}", {Identifiant reseau})
      )`,
      getCreateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        'Identifiant reseau': changement.id_sncu,
        has_trace: changement.is_line,
        communes: changement.ign_communes.join(','),
      }),
      getUpdateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        has_trace: changement.is_line,
        communes: changement.ign_communes.join(','),
      }),
      fieldsConversion: {
        id_fcu: TypeString,
        has_trace: TypeBool,
        communes: TypeString,
      },
    },
  },
  {
    tableCible: 'public.zone_de_developpement_prioritaire', // attention pas de pluriel ici
    tableChangements: 'wip_traces.changements_zones_de_developpement_prioritaire',
  },
  {
    tableCible: 'public.zones_et_reseaux_en_construction',
    tableChangements: 'wip_traces.changements_zones_et_reseaux_en_construction',
    postgres: {
      getCreateProps: (changement) => ({
        is_zone: !changement.is_line,
        communes: changement.ign_communes,
      }),
      getUpdateProps: (changement) => ({
        is_zone: !changement.is_line,
        communes: changement.ign_communes,
      }),
    },
    airtable: {
      tableName: 'FCU - Futur réseaux de chaleur',
      getCreateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        // is_zone: !changement.is_line, // pas encore disponible car ST_MultiPolygon partout
        communes: changement.ign_communes.join(','),
      }),
      getUpdateProps: (changement) => ({
        id_fcu: changement.id_fcu,
        // is_zone: !changement.is_line, // pas encore disponible car ST_MultiPolygon partout
        communes: changement.ign_communes.join(','),
      }),
      fieldsConversion: {
        id_fcu: TypeString,
        // is_zone: TypeBool,
        communes: TypeString,
      },
    },
  },
];

// vues postgres changements_*
type Changement = {
  id_fcu: number;
  changement: 'Ajouté' | 'Modifié' | 'Supprimé' | 'Identique';
  geom: object;
  is_line: boolean;
  ign_communes: string[];
} & Record<string, any>;

/**
 * Suite à l'intégration des données de Sébastien dans le schéma wip_traces, cette fonction permet d'appliquer les changements de géométrie
 * dans les tables finales.
 *
 * Boucle sur les changements et modif des tables cibles :
 *   - si supprimé, alors on supprime dans PG et aussi dans airtable
 *   - si ajouté, alors on ajoute et on fait correspondre côté airtable via id sncu
 *   - si modifié, on maj la geom et has_trace de airtable
 *
 * Lien avec airtable
 * - réseau de froid :
 *   - création airtable :
 *     - si id_fcu existant : Identifiant reseau, has_trace
 *     - si Identifiant reseau existant : id_fcu, has_trace
 *     - sinon : id_fcu, Identifiant reseau, has_trace, communes
 *   - modification airtable :
 *     - si id_fcu existant : has_trace
 *     - sinon : erreur
 * - réseau de chaleur :
 *   - création airtable :
 *     - si id_fcu existant : Identifiant reseau, has_trace
 *     - si Identifiant reseau existant : id_fcu, has_trace
 *     - sinon : id_fcu, Identifiant reseau, has_trace, communes
 *   - modification airtable :
 *     - si id_fcu existant : has_trace
 *     - sinon : erreur
 * - futur réseau :
 *   - création airtable : is_zone, communes
 *   - modification airtable : is_zone
 * - zone DP : rien
 */
export const applyGeometryUpdates = async (dryRun: boolean) => {
  globalDryRun = dryRun;
  for (const tableConfig of tableConfigs) {
    const changements = await db(tableConfig.tableChangements)
      .select(
        'id_fcu',
        'changement',
        'ign_communes',
        db.raw('geom_new as geom'),
        db.raw("st_geometrytype(geom_new) = 'ST_MultiLineString' as is_line"), // spécifique mais un peu commun quand même
        ...(tableConfig.tableChangementsSelectFields ? tableConfig.tableChangementsSelectFields : [])
      )
      .where('changement_geom', '=', true)
      .orderBy('id_fcu');

    if (!changements.length) {
      logger.info(`\n\n# ${tableConfig.tableCible} : aucun changement détecté`);
      continue;
    }

    logger.info(`\n\n# ${tableConfig.tableCible} : ${changements.length} changement${changements.length > 1 ? 's' : ''}`);

    for (const changement of changements) {
      logger.info(`${changement.id_fcu} - ${changement.changement}`);

      switch (changement.changement) {
        case 'Ajouté': {
          await logPGQuery(
            db(tableConfig.tableCible).insert({
              id_fcu: changement.id_fcu,
              geom: changement.geom,
              ...(tableConfig.postgres?.getCreateProps ? tableConfig.postgres?.getCreateProps(changement) : {}),
            })
          );

          if (tableConfig.airtable) {
            await createAirtable(tableConfig.airtable, changement);
          }
          break;
        }

        case 'Modifié': {
          await logPGQuery(
            db(tableConfig.tableCible)
              .update({
                geom: changement.geom,
                ...(tableConfig.postgres?.getUpdateProps ? tableConfig.postgres?.getUpdateProps(changement) : {}),
              })
              .where('id_fcu', '=', changement.id_fcu)
          );

          if (tableConfig.airtable) {
            await updateAirtable(tableConfig.airtable, changement);
          }
          break;
        }
        case 'Supprimé': {
          await logPGQuery(db(tableConfig.tableCible).delete().where('id_fcu', '=', changement.id_fcu));

          if (tableConfig.airtable) {
            await deleteAirtable(tableConfig.airtable, changement);
          }
          break;
        }
      }
    }
  }
};

// stratégies de mises à jour côté airtable

async function createAirtable(airtableConfig: AirtableConfig, changement: Changement) {
  // recherche par id_fcu et/ou Identifiant reseau parfois
  const records = await AirtableDB(airtableConfig.tableName)
    .select({
      filterByFormula: airtableConfig.createSearchFormula?.(changement) ?? `{id_fcu} = "${changement.id_fcu}"`,
      maxRecords: 1,
    })
    .firstPage();

  if (records.length === 0) {
    await logAirtableQuery('create', airtableConfig.tableName, airtableConfig.getCreateProps(changement));
    return;
  }
  const recordId = records[0].id;
  await logAirtableQuery('update', airtableConfig.tableName, recordId, airtableConfig.getUpdateProps(changement));
}

async function updateAirtable(airtableConfig: AirtableConfig, changement: Changement) {
  // recherche par id_fcu
  const records = await AirtableDB(airtableConfig.tableName)
    .select({
      filterByFormula: `{id_fcu} = "${changement.id_fcu}"`,
      maxRecords: 1,
    })
    .firstPage();

  if (records.length === 0) {
    logger.error(`- Aucun record airtable trouvé pour la modification avec id FCU '${changement.id_fcu}'`);
    return;
  }

  const recordId = records[0].id;
  await logAirtableQuery('update', airtableConfig.tableName, recordId, airtableConfig.getUpdateProps(changement));
}

async function deleteAirtable(airtableConfig: AirtableConfig, changement: Changement) {
  // recherche par id_fcu
  const records = await AirtableDB(airtableConfig.tableName)
    .select({
      filterByFormula: `{id_fcu} = "${changement.id_fcu}"`,
      maxRecords: 1,
    })
    .firstPage();

  if (records.length === 0) {
    logger.warn(`Record airtable non trouvé pour l'id FCU '${changement.id_fcu}'. Déjà supprimé ?`);
    return;
  }
  const recordId = records[0].id;
  await logAirtableQuery('destroy', airtableConfig.tableName, recordId);
}

// fonctions utilitaires pour logger les requêtes

function logPGQuery(query: Knex.QueryBuilder<any, number>): Promise<any> {
  queriesLogger.debug('- PG: ' + truncateGeomCoordinates(query.toQuery()));
  return !globalDryRun ? query : Promise.resolve();
}

function logAirtableQuery(operation: 'create', table: AirtableTable, data: object): Promise<any>;
function logAirtableQuery(operation: 'update', table: AirtableTable, recordId: string, data: object): Promise<any>;
function logAirtableQuery(operation: 'destroy', table: AirtableTable, recordId: string): Promise<any>;
async function logAirtableQuery(
  operation: 'create' | 'update' | 'destroy',
  table: AirtableTable,
  recordIdOrData: string | object,
  data?: object
): Promise<any> {
  if (operation === 'create') {
    queriesLogger.debug(`- Airtable: ${operation} ${table} ${JSON.stringify(recordIdOrData)}`);
    !globalDryRun && (await AirtableDB(table).create(recordIdOrData as object));
    return;
  }
  if (operation === 'update') {
    queriesLogger.debug(`- Airtable: ${operation} ${table} ${recordIdOrData}: ${JSON.stringify(data)}`);
    !globalDryRun && (await AirtableDB(table).update(recordIdOrData as string, data as object));
    return;
  }
  if (operation === 'destroy') {
    queriesLogger.debug(`- Airtable: ${operation} ${table} ${recordIdOrData}`);
    !globalDryRun && (await AirtableDB(table).destroy(recordIdOrData as string));
    return;
  }
  throw new Error(`Invalid operation '${operation}'`);
}

function truncateGeomCoordinates(jsonGeom: string): string {
  return jsonGeom.replace(/"geom" = '[^']+'/, '"geom" = \'[truncated]\'').replace(/ '010[^']+'/, "'[truncated]'");
}
