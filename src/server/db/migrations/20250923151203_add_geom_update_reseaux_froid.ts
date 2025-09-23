import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Add geom_update column to reseaux_de_froid to store geometry modifications and new network geometries
    ALTER TABLE public.reseaux_de_froid ADD COLUMN IF NOT EXISTS geom_update geometry;

    -- Make existing geom column nullable to support new networks created with only geom_update
    ALTER TABLE public.reseaux_de_froid ALTER COLUMN geom DROP NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Restore NOT NULL constraint on geom column
    ALTER TABLE public.reseaux_de_froid ALTER COLUMN geom SET NOT NULL;
    
    -- Drop geom_update column
    ALTER TABLE public.reseaux_de_froid DROP COLUMN IF EXISTS geom_update;
  `);
}
