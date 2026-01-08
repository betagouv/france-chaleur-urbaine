import { createLogger, format, transports } from 'winston';

import { AirtableDB, type AirtableTable } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { formatAsISODate } from '@/utils/date';

import { type Type, TypeBool, TypeString } from './download-network';

// pour juste logger et ne pas faire les opérations
let globalDryRun = false;

// 2 loggers pour conserver la traces sur la console et dans des fichiers

const logger = createLogger({
  format: format.printf(({ level, message }) => {
    return (level === 'error' ? `*** ERROR ***: ${message}` : level === 'warn' ? `* WARN *: ${message}` : message) as string;
  }),
  level: 'debug',
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'changements_données_tracées.log',
      options: { flags: 'w' }, // truncate
    }),
  ],
});

const queriesLogger = createLogger({
  format: format.printf(({ level, message }) => {
    return (level === 'error' ? `*** ERROR ***: ${message}` : message) as string;
  }),
  level: 'debug',
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
    airtable: {
      createSearchFormula: (changement) => `OR(
        FIND(${changement.id_fcu}, {id_fcu}) ${changement.id_sncu ? `, FIND("${changement.id_sncu}", {Identifiant reseau})` : ''}
      )`,
      fieldsConversion: {
        communes: TypeString,
        date_actualisation_pdp: TypeString,
        date_actualisation_trace: TypeString,
        departement: TypeString,
        has_PDP: TypeBool,
        has_trace: TypeBool,
        id_fcu: TypeString,
        region: TypeString,
      },
      getCreateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        has_trace: changement.is_line,
        'Identifiant reseau': changement.id_sncu,
        id_fcu: changement.id_fcu,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        date_actualisation_pdp: changement.date_actualisation_pdp ? formatAsISODate(changement.date_actualisation_pdp) : null,
        date_actualisation_trace: changement.date_actualisation_trace ? formatAsISODate(changement.date_actualisation_trace) : null,
        departement: changement.departement,
        has_PDP: changement.has_PDP,
        has_trace: changement.is_line,
        id_fcu: changement.id_fcu,
        region: changement.region,
      }),
      tableName: 'FCU - Réseaux de chaleur',
    },
    pgToAirtableSyncAdditionalFields: ['has_PDP', 'date_actualisation_trace', 'date_actualisation_pdp'],
    postgres: {
      getCreateProps: (changement) => ({
        communes: changement.ign_communes,
        has_trace: changement.is_line,
        'Identifiant reseau': changement.id_sncu,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes,
        has_trace: changement.is_line,
      }),
    },
    tableChangements: 'wip_traces.changements_reseaux_de_chaleur',
    tableChangementsSelectFields: ['id_sncu_new as id_sncu'],
    tableCible: 'public.reseaux_de_chaleur',
  },
  {
    airtable: {
      createSearchFormula: (changement) => `OR(
        FIND(${changement.id_fcu}, {id_fcu}),
        FIND("${changement.id_sncu}", {Identifiant reseau})
      )`,
      fieldsConversion: {
        communes: TypeString,
        date_actualisation_trace: TypeString,
        departement: TypeString,
        has_trace: TypeBool,
        id_fcu: TypeString,
        region: TypeString,
      },
      getCreateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        has_trace: changement.is_line,
        'Identifiant reseau': changement.id_sncu,
        id_fcu: changement.id_fcu,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        date_actualisation_trace: changement.date_actualisation_trace ? formatAsISODate(changement.date_actualisation_trace) : null,
        departement: changement.departement,
        has_trace: changement.is_line,
        id_fcu: changement.id_fcu,
        region: changement.region,
      }),
      tableName: 'FCU - Réseaux de froid',
    },
    pgToAirtableSyncAdditionalFields: ['date_actualisation_trace'],
    postgres: {
      getCreateProps: (changement) => ({
        communes: changement.ign_communes,
        has_trace: changement.is_line,
        'Identifiant reseau': changement.id_sncu,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes,
        has_trace: changement.is_line,
      }),
    },
    tableChangements: 'wip_traces.changements_reseaux_de_froid',
    tableChangementsSelectFields: ['id_sncu_new as id_sncu'],
    tableCible: 'public.reseaux_de_froid',
  },
  {
    tableChangements: 'wip_traces.changements_zones_de_developpement_prioritaire',
    tableCible: 'public.zone_de_developpement_prioritaire', // attention pas de pluriel ici
  },
  {
    airtable: {
      fieldsConversion: {
        communes: TypeString,
        date_actualisation_trace: TypeString,
        departement: TypeString,
        id_fcu: TypeString,
        is_zone: TypeBool,
        region: TypeString,
      },
      getCreateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        id_fcu: changement.id_fcu,
        is_zone: changement.is_zone,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes.join(','),
        date_actualisation_trace: changement.date_actualisation_trace ? formatAsISODate(changement.date_actualisation_trace) : null,
        departement: changement.departement,
        id_fcu: changement.id_fcu,
        is_zone: changement.is_zone,
        region: changement.region,
      }),
      tableName: 'FCU - Futurs réseaux de chaleur',
    },
    pgToAirtableSyncAdditionalFields: ['is_zone', 'date_actualisation_trace'],
    postgres: {
      getCreateProps: (changement) => ({
        communes: changement.ign_communes,
        is_zone: !changement.is_line,
      }),
      getUpdateProps: (changement) => ({
        communes: changement.ign_communes,
        is_zone: !changement.is_line,
      }),
    },
    tableChangements: 'wip_traces.changements_zones_et_reseaux_en_construction',
    tableCible: 'public.zones_et_reseaux_en_construction',
  },
];

// vues postgres changements_*
export type Changement = {
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
    const changements = (await kdb
      .selectFrom(tableConfig.tableChangements as any)
      .select([
        'id_fcu',
        'changement',
        'ign_communes',
        sql<any>`geom_new`.as('geom'),
        sql<boolean>`st_geometrytype(geom_new) = 'ST_MultiLineString'`.as('is_line'), // spécifique mais un peu commun quand même
        ...(tableConfig.tableChangementsSelectFields ? tableConfig.tableChangementsSelectFields : []),
      ])
      .where('changement_geom', '=', true)
      .orderBy('id_fcu')
      .execute()) as Changement[];

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
            kdb.insertInto(tableConfig.tableCible as any).values({
              geom: changement.geom,
              id_fcu: changement.id_fcu,
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
            kdb
              .updateTable(tableConfig.tableCible as any)
              .set({
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
          await logPGQuery(kdb.deleteFrom(tableConfig.tableCible as any).where('id_fcu', '=', changement.id_fcu));

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

async function logPGQuery<T>(queryBuilder: { compile: () => { sql: string; parameters: readonly unknown[] } }): Promise<any> {
  const compiled = queryBuilder.compile();
  const queryStr = `${compiled.sql} -- params: ${JSON.stringify(compiled.parameters)}`;
  queriesLogger.debug(`- PG: ${truncateGeomCoordinates(queryStr)}`);
  if (!globalDryRun) {
    // Execute the query
    return (queryBuilder as any).execute();
  }
  return Promise.resolve();
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
    if (!globalDryRun) await AirtableDB(table).create(recordIdOrData as object);
    return;
  }
  if (operation === 'update') {
    queriesLogger.debug(`- Airtable: ${operation} ${table} ${recordIdOrData}: ${JSON.stringify(data)}`);
    if (!globalDryRun) await AirtableDB(table).update(recordIdOrData as string, data as object);
    return;
  }
  if (operation === 'destroy') {
    queriesLogger.debug(`- Airtable: ${operation} ${table} ${recordIdOrData}`);
    if (!globalDryRun) await AirtableDB(table).destroy(recordIdOrData as string);
    return;
  }
  throw new Error(`Invalid operation '${operation}'`);
}

function truncateGeomCoordinates(jsonGeom: string): string {
  return jsonGeom.replace(/"geom" = '[^']+'/, '"geom" = \'[truncated]\'').replace(/ '010[^']+'/, "'[truncated]'");
}
