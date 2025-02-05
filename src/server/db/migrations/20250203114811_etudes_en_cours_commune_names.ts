import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE etudes_en_cours ADD COLUMN IF NOT EXISTS description VARCHAR(255)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE etudes_en_cours DROP COLUMN IF EXISTS description');
}
