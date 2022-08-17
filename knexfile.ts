import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export default {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  acquireConnectionTimeout: 10000,
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/db/migrations',
  },
};
