import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export const up = async (db: Kysely<any>) => {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS alternative_heating_solutions text[] NOT NULL DEFAULT '{}';
  `.execute(db);
};

export const down = async (db: Kysely<any>) => {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS alternative_heating_solutions;
  `.execute(db);
};
