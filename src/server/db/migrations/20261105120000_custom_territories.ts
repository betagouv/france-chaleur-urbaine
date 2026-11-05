import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE public.custom_territories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      recipe jsonb NOT NULL,
      commune_codes text[] NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX idx_custom_territories_name ON public.custom_territories (lower(name));
    CREATE INDEX idx_custom_territories_commune_codes ON public.custom_territories USING GIN (commune_codes);

    ALTER TABLE public.demands ADD COLUMN custom_territory_ids uuid[] NOT NULL DEFAULT '{}';
    CREATE INDEX idx_demands_custom_territory_ids ON public.demands USING GIN (custom_territory_ids);

    ALTER TABLE public.demands_chaleur_renouvelable ADD COLUMN custom_territory_ids uuid[] NOT NULL DEFAULT '{}';
    CREATE INDEX idx_demands_chaleur_renouvelable_custom_territory_ids ON public.demands_chaleur_renouvelable USING GIN (custom_territory_ids);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS idx_demands_chaleur_renouvelable_custom_territory_ids;
    ALTER TABLE public.demands_chaleur_renouvelable DROP COLUMN IF EXISTS custom_territory_ids;
    DROP INDEX IF EXISTS idx_demands_custom_territory_ids;
    ALTER TABLE public.demands DROP COLUMN IF EXISTS custom_territory_ids;
    DROP TABLE IF EXISTS public.custom_territories;
  `.execute(db);
}
