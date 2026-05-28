import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS batiment_construction_id text,
      ADD COLUMN IF NOT EXISTS hot_water_system_type text,
      ADD COLUMN IF NOT EXISTS is_public_advisor_selected boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS radiator_type text,
      ADD COLUMN IF NOT EXISTS refusal_period text,
      ADD COLUMN IF NOT EXISTS refusal_reason text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS refusal_reason,
      DROP COLUMN IF EXISTS refusal_period,
      DROP COLUMN IF EXISTS radiator_type,
      DROP COLUMN IF EXISTS is_public_advisor_selected,
      DROP COLUMN IF EXISTS hot_water_system_type,
      DROP COLUMN IF EXISTS batiment_construction_id;
  `.execute(db);
}
