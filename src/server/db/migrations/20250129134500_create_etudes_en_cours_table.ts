import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists('etudes_en_cours', (table) => {
    table.integer('id').primary();
    table.string('maitre_ouvrage').notNullable();
    table.string('status').notNullable();
    table.geometry('geom').notNullable();
    table.specificType('commune_ids', 'TEXT[5]').notNullable();
    table.timestamp('launched_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('etudes_en_cours');
}
