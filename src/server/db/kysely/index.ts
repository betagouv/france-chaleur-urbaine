import { type Insertable, type InsertObject, Kysely, PostgresDialect, sql } from 'kysely';
import { Pool, types } from 'pg';
import Cursor from 'pg-cursor';

import { serverConfig } from '@/server/config';
import { parentLogger } from '@/server/helpers/logger';
import { sleep } from '@/utils/time';

import type { DB as Database } from './database';

export * from './database';
export { type Insertable, type InsertObject, sql };

// Automatically convert postgres number fields from string to javascript numbers.
types.setTypeParser(types.builtins.INT2, (value) => parseInt(value, 10));
types.setTypeParser(types.builtins.INT4, (value) => parseInt(value, 10));
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));
types.setTypeParser(types.builtins.FLOAT4, (value) => parseFloat(value));
types.setTypeParser(types.builtins.FLOAT8, (value) => parseFloat(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

const dialect = new PostgresDialect({
  cursor: Cursor,
  pool: new Pool({
    application_name: 'FCU-API',
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 30000,
    max: 60,
    min: 5,
  }),
});

const logger = parentLogger.child({
  module: 'database',
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const kdb = new Kysely<Database>({
  dialect,
  log: serverConfig.LOG_SQL_QUERIES
    ? (event) => {
        if (serverConfig.LOG_SQL_QUERIES_PRETTY) {
          console.info(
            `\n${`query ${event.level === 'error' ? 'failed' : 'completed'}`}\n${event.query.sql}\nParams:`,
            event.query.parameters
          );
          if (event.level === 'error') {
            console.info('Erreur:', event.error);
          }
        } else {
          logger.debug(`query ${event.level === 'error' ? 'failed' : 'completed'}`, {
            durationMs: Math.round(event.queryDurationMillis),
            params: event.query.parameters,
            sql: event.query.sql,
            ...(event.level === 'error' ? { error: event.error } : {}),
          });
        }
      }
    : undefined,
});

/**
 * Try to shut down database connections. (timeout is 2 seconds)
 */
export async function shutdownKyselyDatabase() {
  logger.warn('shutting down database connections');
  await Promise.race([kdb.destroy(), sleep(2000)]);
}
