import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.jobs ALTER COLUMN entity_id DROP NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE IF EXISTS public.jobs ALTER COLUMN entity_id SET NOT NULL;
  `);
}
