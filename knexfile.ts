import dotenv from 'dotenv';
import { Knex } from 'knex';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default {
  client: 'pg',
  connection: addApplicationName(process.env.DATABASE_URL as string),
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/db/migrations',
  },
  acquireConnectionTimeout: 30000,
  pool: {
    idleTimeoutMillis: 10000,
    min: 0,
    max: 60,
  },
} satisfies Knex.Config;

function addApplicationName(connectionString: string | undefined): string | undefined {
  return connectionString === undefined
    ? undefined
    : `${connectionString}${connectionString.includes('?') ? '&' : '?'}application_name=FCU-API`;
}
