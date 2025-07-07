import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zone_de_developpement_prioritaire', (table) => {
    table.integer('reseau_de_chaleur_id_fcu');
    table.integer('reseau_en_construction_id_fcu');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('zone_de_developpement_prioritaire', (table) => {
    table.dropColumn('reseau_de_chaleur_id_fcu');
    table.dropColumn('reseau_en_construction_id_fcu');
  });
}
