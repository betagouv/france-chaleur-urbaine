import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zones_et_reseaux_en_construction', (table) => {
    table.string('nom_reseau');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zones_et_reseaux_en_construction', (table) => {
    table.dropColumn('nom_reseau');
  });
}
