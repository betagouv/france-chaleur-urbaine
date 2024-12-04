import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.string('role').notNullable().defaultTo('gestionnaire');
    table.text('gestionnaire').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.dropColumn('role');
    table.text('gestionnaire').notNullable().alter();
  });
}
