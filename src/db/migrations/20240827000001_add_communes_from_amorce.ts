import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists('communes', (table) => {
    table.string('id').primary();
    table.string('code_postal').notNullable();
    table.string('commune').notNullable();
    table.string('departement_id').notNullable();
    table.foreign('departement_id').references('id').inTable('departements');
    table.integer('altitude_moyenne').notNullable();
    table.decimal('temperature_ref_altitude_moyenne').notNullable();
    table.string('source').notNullable();
    table.string('sous_zones_climatiques').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('communes');
}
