import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
export { sql } from 'kysely';
export * from './database';
import '@/server/db'; // permet d'importer les variables d'env correctement

import { serverConfig } from '@/server/config';
import { parentLogger } from '@/server/helpers/logger';
import { sleep } from '@/utils/time';

import { type DB as Database } from './database';

// Automatically convert postgres number fields from string to javascript numbers.
types.setTypeParser(types.builtins.INT2, (value) => parseInt(value));
types.setTypeParser(types.builtins.INT4, (value) => parseInt(value));
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value));
types.setTypeParser(types.builtins.FLOAT4, (value) => parseFloat(value));
types.setTypeParser(types.builtins.FLOAT8, (value) => parseFloat(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString: process.env.DATABASE_URL }),
});

const logger = parentLogger.child({
  module: 'database',
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
  log: serverConfig.LOG_SQL_QUERIES
    ? (event) => {
        logger.debug(`query ${event.level === 'error' ? 'failed' : 'completed'}`, {
          durationMs: Math.round(event.queryDurationMillis),
          sql: event.query.sql,
          params: event.query.parameters,
          ...(event.level === 'error' ? { error: event.error } : {}),
        });
      }
    : undefined,
});

/**
 * Try to shut down database connections. (timeout is 2 seconds)
 */
export async function shutdownKyselyDatabase() {
  logger.warn('shutting down database connections');
  await Promise.race([db.destroy(), sleep(2000)]);
}

/**
 * Kysely database. Allows better distinction with knex `db` variable.
 */
export const kdb = db;
