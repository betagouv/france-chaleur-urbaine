import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur
    ADD COLUMN IF NOT EXISTS geom_update geometry;
    ALTER TABLE public.zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS geom_update geometry;
    ALTER TABLE public.zone_de_developpement_prioritaire
    ADD COLUMN IF NOT EXISTS geom_update geometry;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur
    DROP COLUMN IF EXISTS geom_update;
    ALTER TABLE public.zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS geom_update;
    ALTER TABLE public.zone_de_developpement_prioritaire
    DROP COLUMN IF EXISTS geom_update;
  `);
}
