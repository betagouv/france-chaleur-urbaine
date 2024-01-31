import dotenv from 'dotenv';
import { Knex } from 'knex';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default {
  client: 'pg',
  connection: addApplicationName(process.env.DATABASE_URL as string),
  acquireConnectionTimeout: 10000,
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/db/migrations',
  },
  pool: {
    idleTimeoutMillis: 10000,
    min: 0,
    max: 20,
  },
} satisfies Knex.Config;

function addApplicationName(
  connectionString: string | undefined
): string | undefined {
  return connectionString === undefined
    ? undefined
    : `${connectionString}${
        connectionString.includes('?') ? '&' : '?'
      }application_name=FCU-API`;
}
