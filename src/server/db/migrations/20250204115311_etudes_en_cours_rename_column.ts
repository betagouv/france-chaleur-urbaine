import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const columnExists = await knex.schema.hasColumn('etudes_en_cours', 'description');
  if (columnExists) {
    await knex.raw('ALTER TABLE etudes_en_cours RENAME COLUMN description TO communes');
  }
}

export async function down(knex: Knex): Promise<void> {
  const columnExists = await knex.schema.hasColumn('etudes_en_cours', 'communes');
  if (columnExists) {
    await knex.raw('ALTER TABLE etudes_en_cours RENAME COLUMN communes TO description');
  }
}
