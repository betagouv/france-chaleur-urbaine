import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
export { sql } from 'kysely';
export * from './database';
import '@/server/db'; // permet d'importer les variables d'env correctement

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

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
});
