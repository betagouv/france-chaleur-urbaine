import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.ouvrages_geothermie_surface_echangeurs_fermes_tiles (
      x bigint NOT NULL,
      y bigint NOT NULL,
      z bigint NOT NULL,
      tile bytea NOT NULL,
      
      CONSTRAINT ouvrages_geothermie_surface_echangeurs_fermes_tiles_pkey PRIMARY KEY (x, y, z)
    );
    CREATE TABLE IF NOT EXISTS public.ouvrages_geothermie_surface_echangeurs_ouverts_tiles (
      x bigint NOT NULL,
      y bigint NOT NULL,
      z bigint NOT NULL,
      tile bytea NOT NULL,
      
      CONSTRAINT ouvrages_geothermie_surface_echangeurs_ouverts_tiles_pkey PRIMARY KEY (x, y, z)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.ouvrages_geothermie_surface_echangeurs_fermes_tiles;
    DROP TABLE IF EXISTS public.ouvrages_geothermie_surface_echangeurs_ouverts_tiles;
  `);
}
