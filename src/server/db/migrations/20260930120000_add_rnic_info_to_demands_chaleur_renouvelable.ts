import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN rnic_nom_copropriete text,
      ADD COLUMN rnic_siret_representant_legal text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS rnic_siret_representant_legal,
      DROP COLUMN IF EXISTS rnic_nom_copropriete;
  `.execute(db);
}
