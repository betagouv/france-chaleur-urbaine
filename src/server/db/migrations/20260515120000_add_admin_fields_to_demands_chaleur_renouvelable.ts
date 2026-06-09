import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'En attente de prise en charge',
      ADD COLUMN IF NOT EXISTS assigned_to text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS assigned_to,
      DROP COLUMN IF EXISTS status;
  `.execute(db);
}
