import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reseaux_de_chaleur', (table) => {
    table.specificType('tags', 'text[]').notNullable().defaultTo('{}');
  });

  await knex.schema.alterTable('zones_et_reseaux_en_construction', (table) => {
    table.specificType('tags', 'text[]').notNullable().defaultTo('{}');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reseaux_de_chaleur', (table) => {
    table.dropColumn('tags');
  });

  await knex.schema.alterTable('zones_et_reseaux_en_construction', (table) => {
    table.dropColumn('tags');
  });
}
