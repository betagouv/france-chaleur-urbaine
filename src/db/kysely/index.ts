import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
export { sql } from 'kysely';
export * from './database';

import { type DB as Database } from './database'; // this is the Database interface we defined earlier

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
