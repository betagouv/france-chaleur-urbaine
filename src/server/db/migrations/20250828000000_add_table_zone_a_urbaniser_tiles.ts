import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.zone_a_urbaniser_tiles
    (
        x bigint NOT NULL,
        y bigint NOT NULL,
        z bigint NOT NULL,
        tile bytea NOT NULL,
        CONSTRAINT zone_a_urbaniser_tiles_pkey PRIMARY KEY (x, y, z)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.zone_a_urbaniser_tiles;
  `);
}
