import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS public.eligibility_demands_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_address text NOT NULL,
    ban_valid boolean,
    ban_address text,
    ban_score integer,
    geom public.geometry(Point,2154),
    eligibility_status jsonb,
    test_id uuid NOT NULL
);
`);

  await knex.raw(`
    ALTER TABLE public.eligibility_tests
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS public.eligibility_demands_addresses;
  `);
}
