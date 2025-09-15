import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur
    ADD COLUMN IF NOT EXISTS geom_update geometry;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur
    DROP COLUMN IF EXISTS geom_update;
  `);
}
