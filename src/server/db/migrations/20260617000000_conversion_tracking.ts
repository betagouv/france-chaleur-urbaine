import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Tracking de conversion first-party (module `conversion-tracking`).
 *
 * - `conversion_sources` : registre des intégrations iframe déployées (l'`id` uuid sert de `source=`, label,
 *   snapshot `config` des params).
 * - `conversion_events` : log append-only. Niveau 1 = `source` (id d'intégration, lu dans `?source=`,
 *   nullable) sinon `route` (pattern Next, ex. `/villes/[ville]`). `page` = pathname exact (drill),
 *   `host` = page embarquante (domaine + pathname, best-effort, propagé par la redirection de `/iframe/form`).
 *   `ip`/`user_agent` = anti-abus (purgés ~90 j) ; `host` = analytics retenu.
 * - `demands.origin_source` (intégration) + `demands.origin_page` (pathname) attribuent chaque demande.
 *
 * Cf. `src/modules/conversion-tracking/AGENTS.md`.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE demands ADD COLUMN origin_source text;
    ALTER TABLE demands ADD COLUMN origin_page text;
    ALTER TABLE demands ADD COLUMN origin_host text;

    CREATE TABLE conversion_sources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      label text NOT NULL,
      config jsonb,
      archived_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE conversion_events (
      id bigserial PRIMARY KEY,
      source text,
      route text NOT NULL,
      type text NOT NULL CHECK (type IN ('display', 'address_test', 'demand')),
      eligible boolean,
      ip inet,
      user_agent text,
      host text,
      page text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    -- Toutes les lectures (getStats, routes connues) filtrent d'abord sur la plage created_at.
    -- B-tree plutôt que BRIN : la purge UPDATE chaque ligne à ~90 j, ce qui casserait la
    -- corrélation created_at/pages dont BRIN dépend.
    CREATE INDEX conversion_events_created_at_idx
      ON conversion_events (created_at);

    CREATE INDEX conversion_events_ip_purge_idx
      ON conversion_events (created_at) WHERE ip IS NOT NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE conversion_events;
    DROP TABLE conversion_sources;
    ALTER TABLE demands DROP COLUMN origin_source;
    ALTER TABLE demands DROP COLUMN origin_page;
    ALTER TABLE demands DROP COLUMN origin_host;
  `.execute(db);
}
