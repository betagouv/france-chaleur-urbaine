import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('eligibility_tests', (table) => {
    table.text('file').notNullable().defaultTo('Not available');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('eligibility_tests', (table) => {
    table.dropColumn('file');
  });
}
