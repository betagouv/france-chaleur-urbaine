import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS gestionnaires_from_api text[] DEFAULT '{}';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.users
    DROP COLUMN IF EXISTS gestionnaires_from_api;
  `);
}
