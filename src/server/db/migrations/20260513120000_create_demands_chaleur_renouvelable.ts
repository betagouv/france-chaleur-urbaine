import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS public.demands_chaleur_renouvelable (
      id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL DEFAULT '',
      occupant_status text NOT NULL,
      heating_energy text NOT NULL,
      project_status text[] NOT NULL DEFAULT '{}',
      address text NOT NULL,
      dpe text NOT NULL,
      housing_type text NOT NULL,
      outdoor_space text NOT NULL,
      average_residents integer NOT NULL,
      housing_count integer NOT NULL,
      average_area integer NOT NULL,
      simulation_url text NOT NULL,
      status text NOT NULL DEFAULT 'En attente de prise en charge',
      assigned_to text,
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT demands_chaleur_renouvelable_pkey PRIMARY KEY (id)
    );

    CREATE INDEX IF NOT EXISTS demands_chaleur_renouvelable_created_at_idx
      ON public.demands_chaleur_renouvelable (created_at);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS public.demands_chaleur_renouvelable;
  `.execute(db);
}
