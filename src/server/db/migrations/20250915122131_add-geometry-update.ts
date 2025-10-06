import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Add geom_update column to store geometry modifications and new network geometries
    ALTER TABLE public.reseaux_de_chaleur ADD COLUMN IF NOT EXISTS geom_update geometry;
    ALTER TABLE public.zones_et_reseaux_en_construction ADD COLUMN IF NOT EXISTS geom_update geometry;
    ALTER TABLE public.zone_de_developpement_prioritaire ADD COLUMN IF NOT EXISTS geom_update geometry;

    -- Make existing geom columns nullable to support new networks created with only geom_update
    ALTER TABLE public.reseaux_de_chaleur ALTER COLUMN geom DROP NOT NULL;
    ALTER TABLE public.zones_et_reseaux_en_construction ALTER COLUMN geom DROP NOT NULL;
    ALTER TABLE public.zone_de_developpement_prioritaire ALTER COLUMN geom DROP NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Restore NOT NULL constraints on geom columns
    ALTER TABLE public.reseaux_de_chaleur ALTER COLUMN geom SET NOT NULL;
    ALTER TABLE public.zones_et_reseaux_en_construction ALTER COLUMN geom SET NOT NULL;
    ALTER TABLE public.zone_de_developpement_prioritaire ALTER COLUMN geom SET NOT NULL;
    
    -- Drop geom_update columns
    ALTER TABLE public.reseaux_de_chaleur DROP COLUMN IF EXISTS geom_update;
    ALTER TABLE public.zones_et_reseaux_en_construction DROP COLUMN IF EXISTS geom_update;
    ALTER TABLE public.zone_de_developpement_prioritaire DROP COLUMN IF EXISTS geom_update;
  `);
}
