import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ALTER COLUMN average_residents TYPE double precision;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM public.demands_chaleur_renouvelable
        WHERE average_residents <> trunc(average_residents)
      ) THEN
        RAISE EXCEPTION 'Cannot restore integer average_residents while decimal values exist';
      END IF;
    END $$;

    ALTER TABLE public.demands_chaleur_renouvelable
      ALTER COLUMN average_residents TYPE integer;
  `.execute(db);
}
