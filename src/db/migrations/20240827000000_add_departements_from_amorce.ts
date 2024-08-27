import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('departements', (table) => {
    table.string('id').primary();
    table.string('nom_departement').notNullable();
    table.decimal('dju_chaud_moyen').nullable();
    table.decimal('dju_froid_moyen').nullable();
    table.string('zone_climatique').nullable();
    table.string('source').nullable();
    table.string('annee').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('departements');
}
