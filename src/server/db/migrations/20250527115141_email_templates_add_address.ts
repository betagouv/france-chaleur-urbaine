import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE pro_comparateur_configurations
    ADD COLUMN IF NOT EXISTS address VARCHAR;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE pro_comparateur_configurations
    DROP COLUMN IF EXISTS address;
  `);
}
