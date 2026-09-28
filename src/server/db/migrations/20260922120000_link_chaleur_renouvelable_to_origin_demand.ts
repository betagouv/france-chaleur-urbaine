import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN IF NOT EXISTS origin_demand_id uuid;

    ALTER TABLE public.demands_chaleur_renouvelable
      ADD CONSTRAINT demands_chaleur_renouvelable_origin_demand_id_fkey
      FOREIGN KEY (origin_demand_id)
      REFERENCES public.demands(id)
      ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS demands_chaleur_renouvelable_origin_demand_id_idx
      ON public.demands_chaleur_renouvelable (origin_demand_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS public.demands_chaleur_renouvelable_origin_demand_id_idx;

    ALTER TABLE public.demands_chaleur_renouvelable
      DROP CONSTRAINT IF EXISTS demands_chaleur_renouvelable_origin_demand_id_fkey,
      DROP COLUMN IF EXISTS origin_demand_id;
  `.execute(db);
}
