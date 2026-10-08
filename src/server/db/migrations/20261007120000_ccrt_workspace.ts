import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.demands_chaleur_renouvelable
      ADD COLUMN commune_code text,
      ADD COLUMN epci_code text,
      ADD COLUMN ept_code text,
      ADD COLUMN region_code text;

    UPDATE public.demands_chaleur_renouvelable d
    SET commune_code = c.insee_com, epci_code = c.siren_epci, region_code = c.insee_reg
    FROM public.bdnb_batenr b, public.ign_communes c
    WHERE b.batiment_construction_id = d.batiment_construction_id
      AND ST_Intersects(c.geom, ST_PointOnSurface(b.geom));

    UPDATE public.demands_chaleur_renouvelable d SET ept_code = e.code
    FROM public.ept e
    WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(e.membres) m WHERE m->>'code' = d.commune_code);

    CREATE TABLE public.ccrt_demand_notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      demand_id uuid NOT NULL REFERENCES public.demands_chaleur_renouvelable(id) ON DELETE CASCADE,
      author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 250),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX ccrt_demand_notes_demand_idx ON public.ccrt_demand_notes(demand_id);

    CREATE TABLE public.ccrt_demand_emails (
      id uuid PRIMARY KEY,
      demand_id uuid NOT NULL REFERENCES public.demands_chaleur_renouvelable(id) ON DELETE CASCADE,
      author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      body text NOT NULL,
      cc text NOT NULL,
      object text NOT NULL,
      reply_to text NOT NULL,
      signature text NOT NULL,
      "to" text NOT NULL,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      sent_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX ccrt_demand_emails_demand_idx ON public.ccrt_demand_emails(demand_id);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DROP TABLE public.ccrt_demand_emails;
    DROP TABLE public.ccrt_demand_notes;
    ALTER TABLE public.demands_chaleur_renouvelable
      DROP COLUMN commune_code, DROP COLUMN epci_code, DROP COLUMN ept_code, DROP COLUMN region_code;
  `.execute(db);
}
