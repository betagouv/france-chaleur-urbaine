import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.pro_eligibility_addresses_tiles (
      x bigint NOT NULL,
      y bigint NOT NULL,
      z bigint NOT NULL,
      tile bytea NOT NULL
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.pro_eligibility_addresses_tiles;
  `);
}
