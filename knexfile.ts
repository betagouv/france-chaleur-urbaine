import '@/load-env';
import type { Knex } from 'knex';

export default {
  acquireConnectionTimeout: 30000,
  client: 'pg',
  connection: addApplicationName(process.env.DATABASE_URL as string),
  migrations: {
    directory: './src/server/db/migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    max: 60,
    min: 0,
  },
} satisfies Knex.Config;

function addApplicationName(connectionString: string | undefined): string | undefined {
  return connectionString === undefined
    ? undefined
    : `${connectionString}${connectionString.includes('?') ? '&' : '?'}application_name=FCU-API`;
}
