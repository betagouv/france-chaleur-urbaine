import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('etudes_en_cours', (table) => {
    table.renameColumn('description', 'communes');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('etudes_en_cours', (table) => {
    table.renameColumn('communes', 'description');
  });
}
