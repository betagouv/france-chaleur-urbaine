import knex from 'knex';

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  acquireConnectionTimeout: 10000,
};

export default knex(config);
