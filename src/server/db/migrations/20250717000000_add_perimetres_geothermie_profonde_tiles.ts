import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.perimetres_geothermie_profonde_tiles (
      x bigint NOT NULL,
      y bigint NOT NULL,
      z bigint NOT NULL,
      tile bytea NOT NULL,
      
      CONSTRAINT perimetres_geothermie_profonde_tiles_pkey PRIMARY KEY (x, y, z)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.perimetres_geothermie_profonde_tiles;
  `);
}
