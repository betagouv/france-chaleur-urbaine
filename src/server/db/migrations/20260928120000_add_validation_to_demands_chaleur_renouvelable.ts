import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS validated boolean;

    UPDATE public.demands_chaleur_renouvelable
      SET validated = true
      WHERE validated IS NULL;

    ALTER TABLE public.demands_chaleur_renouvelable
      ALTER COLUMN validated SET DEFAULT false,
      ALTER COLUMN validated SET NOT NULL;

    CREATE INDEX IF NOT EXISTS demands_chaleur_renouvelable_validated_idx
      ON public.demands_chaleur_renouvelable (validated);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS public.demands_chaleur_renouvelable_validated_idx;

    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN IF EXISTS validated;
  `.execute(db);
}
