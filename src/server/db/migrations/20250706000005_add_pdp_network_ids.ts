import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zone_de_developpement_prioritaire', (table) => {
    table.specificType('reseau_de_chaleur_ids', 'integer[]').notNullable().defaultTo('{}');
    table.specificType('reseau_en_construction_ids', 'integer[]').notNullable().defaultTo('{}');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zone_de_developpement_prioritaire', (table) => {
    table.dropColumn('reseau_de_chaleur_ids');
    table.dropColumn('reseau_en_construction_ids');
  });
}
