import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config({ path: '.env.local' });
dotenv.config();

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  acquireConnectionTimeout: 10000,
};

export default knex(config);
