import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('api_accounts', (table) => {
    table.string('key', 255).notNullable().primary();
    table.string('token', 255).notNullable();
  });
  await knex.raw(
    'ALTER TABLE api_accounts ADD COLUMN gestionnaires varchar(255)[];'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('api_accounts');
}
