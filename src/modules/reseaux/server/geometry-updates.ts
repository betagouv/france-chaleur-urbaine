import { createLogger, format, transports } from 'winston';

import { kdb, sql } from '@/server/db/kysely';

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

type TableConfig = {
  tableChangements: string;
  tableChangementsSelectFields?: string[];
  tableCible: string;
  postgres?: PostgresConfig;
};

// Cette configuration permet de mettre à jour chaque type de données avec ses spécificités
export const tableConfigs: TableConfig[] = [
  {
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
 *   - si supprimé, alors on supprime dans PG
 *   - si ajouté, alors on ajoute
 *   - si modifié, on met à jour la géométrie
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

          break;
        }
        case 'Supprimé': {
          await logPGQuery(kdb.deleteFrom(tableConfig.tableCible as any).where('id_fcu', '=', changement.id_fcu));

          break;
        }
      }
    }
  }
};

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

function truncateGeomCoordinates(jsonGeom: string): string {
  return jsonGeom.replace(/"geom" = '[^']+'/, '"geom" = \'[truncated]\'').replace(/ '010[^']+'/, "'[truncated]'");
}
