import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.string('from_api');
  });
  await knex.schema.table('api_accounts', (table) => {
    table.string('name');
  });

  await knex.raw(
    'ALTER TABLE users ADD CONSTRAINT users_email_unicity UNIQUE (email);'
  );
  await knex.raw(
    'ALTER TABLE api_accounts ADD COLUMN networks varchar(255)[];'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('api_accounts', (table) => {
    table.dropColumn('networks');
  });
  await knex.schema.table('users', (table) => {
    table.dropColumn('from_api');
  });
  await knex.schema.table('api_accounts', (table) => {
    table.dropColumn('name');
  });
  await knex.raw('ALTER TABLE users DROP CONSTRAINT users_email_unicity;');
}
