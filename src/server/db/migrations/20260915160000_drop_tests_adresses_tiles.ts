import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS public.pro_eligibility_tests_addresses_tiles;
    DROP TABLE IF EXISTS public.tests_adresses_tiles_features;
    DELETE FROM public.tiles_metadata WHERE source_id = 'tests-adresses';
    DELETE FROM public.jobs WHERE type = 'build_tiles' AND data->>'name' = 'tests-adresses';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE public.pro_eligibility_tests_addresses_tiles (
      x bigint NOT NULL,
      y bigint NOT NULL,
      z bigint NOT NULL,
      tile bytea NOT NULL,
      CONSTRAINT pro_eligibility_tests_addresses_tiles_pkey PRIMARY KEY (z, x, y)
    );
    INSERT INTO public.tiles_metadata (source_id, last_modified_at) VALUES ('tests-adresses', now()) ON CONFLICT DO NOTHING;
  `.execute(db);
}
