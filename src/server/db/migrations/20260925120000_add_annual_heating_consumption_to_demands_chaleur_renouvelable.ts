import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS annual_heating_consumption double precision;

    ALTER TABLE public.demands_chaleur_renouvelable
      ADD CONSTRAINT demands_chaleur_renouvelable_annual_heating_consumption_positive
      CHECK (annual_heating_consumption IS NULL OR annual_heating_consumption > 0);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP CONSTRAINT IF EXISTS demands_chaleur_renouvelable_annual_heating_consumption_positive,
      DROP COLUMN IF EXISTS annual_heating_consumption;
  `.execute(db);
}
