import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS demand_concern text,
      ADD COLUMN IF NOT EXISTS organization_name text,
      ADD COLUMN IF NOT EXISTS surface_area integer;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS surface_area,
      DROP COLUMN IF EXISTS organization_name,
      DROP COLUMN IF EXISTS demand_concern;
  `.execute(db);
}
