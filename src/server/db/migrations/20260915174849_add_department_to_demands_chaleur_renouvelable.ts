import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS departement_code text;

    CREATE INDEX IF NOT EXISTS demands_chaleur_renouvelable_departement_code_idx
      ON public.demands_chaleur_renouvelable (departement_code);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS public.demands_chaleur_renouvelable_departement_code_idx;

    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS departement_code;
  `.execute(db);
}
