import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('etudes_en_cours', (table) => {
    table.string('description');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('etudes_en_cours', (table) => {
    table.dropColumn('description');
  });
}
