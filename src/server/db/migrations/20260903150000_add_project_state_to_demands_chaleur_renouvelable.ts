import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS project_state text NOT NULL DEFAULT 'En réflexion',
      ALTER COLUMN status SET DEFAULT 'A traiter';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ALTER COLUMN status SET DEFAULT 'En attente de prise en charge',
      DROP COLUMN IF EXISTS project_state;
  `.execute(db);
}
