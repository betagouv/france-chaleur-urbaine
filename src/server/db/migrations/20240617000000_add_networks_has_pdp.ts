import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reseaux_de_chaleur', (table) => {
    table.boolean('has_PDP').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reseaux_de_chaleur', (table) => {
    table.dropColumn('has_PDP');
  });
}
