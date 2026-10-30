import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * First-party tracking of the renewable heating simulations (module `chaleur-renouvelable`).
 *
 * One row per address or building tested on the results page (a change chains a new row to the previous one through
 * `previous_simulation_id`), created and updated by the client (no consent, no identifier persisted in the browser): where the simulation was started from (`route` / `page` + the conversion attribution `source` / `host`),
 * the current inputs and the contact options that were offered, the outcome declared by the client after the server
 * confirmed the demand (with the created demand id, or on the France Rénov' click), and the anti-abuse columns shared with `conversion_events`
 * (`ip` / `user_agent` purged by cron, `excluded` driven by `conversion_ip_rules`). `address` and
 * `batiment_construction_id` are purged with the IP.
 *
 * See `src/modules/chaleur-renouvelable/AGENTS.md`.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE simulations_chaleur_renouvelable (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      revisions integer NOT NULL DEFAULT 0,
      previous_simulation_id uuid,
      route text NOT NULL,
      page text NOT NULL,
      source text,
      host text,
      housing_type text NOT NULL,
      radiator_type text,
      outdoor_space text,
      address text,
      address_resolved boolean NOT NULL DEFAULT true,
      batiment_construction_id text,
      commune_code text,
      departement_code text,
      heat_network_available boolean NOT NULL,
      ccrt_demand_available boolean NOT NULL,
      recommended_solution text,
      refusal_already_known boolean NOT NULL DEFAULT false,
      outcome text CHECK (outcome IN ('heat_network_demand', 'ccrt_demand', 'france_renov_orientation')),
      outcome_at timestamptz,
      demand_id text,
      ip inet,
      user_agent text,
      excluded boolean NOT NULL DEFAULT false
    );
    CREATE INDEX simulations_chaleur_renouvelable_created_at_idx ON simulations_chaleur_renouvelable (created_at);
    CREATE INDEX simulations_chaleur_renouvelable_purge_idx ON simulations_chaleur_renouvelable (created_at) WHERE ip IS NOT NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE simulations_chaleur_renouvelable;
  `.execute(db);
}
