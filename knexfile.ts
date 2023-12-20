import dotenv from 'dotenv';

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
};

function addApplicationName(connectionString: string): string {
  return `${connectionString}${
    connectionString.includes('?') ? '&' : '?'
  }application_name=FCU-API`;
}
