import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Anti-abus du module `conversion-tracking` : règles IP/CIDR (bannir ou conserver) + flag matérialisé.
 *
 * - `conversion_ip_rules` : décisions admin sur une IP ou plage CIDR (IPv4/IPv6). `disposition` :
 *   `exclude` (retirée des stats) ou `keep` (IP légitime connue, à ne pas bannir — annotation).
 *   `reason` obligatoire (mémoire de la décision). Matching par `<<=` (inclusion réseau, cross-famille
 *   v4/v6 = `false`) ; la règle la plus spécifique (`masklen` max) l'emporte.
 * - `conversion_events.excluded` : flag persisté sur la ligne. Indispensable car `ip`/`user_agent` sont
 *   purgés à ~90 j → un filtrage « au read » par jointure ne couvrirait pas l'historique purgé. Toute
 *   modification d'une règle réconcilie ce flag sur la plage (cf. service `reconcileExcludedForRange`),
 *   ce qui nettoie les stats existantes et fige l'exclusion avant purge. `getStats` ne lit que
 *   `excluded = false` ; `recordEvent` le repose à l'insert (règle « collante »).
 *
 * Cf. `src/modules/conversion-tracking/AGENTS.md`.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE conversion_events ADD COLUMN excluded boolean NOT NULL DEFAULT false;

    CREATE TABLE conversion_ip_rules (
      ip inet PRIMARY KEY,
      disposition text NOT NULL CHECK (disposition IN ('exclude', 'keep')),
      reason text NOT NULL,
      created_by uuid REFERENCES users (id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE conversion_ip_rules;
    ALTER TABLE conversion_events DROP COLUMN excluded;
  `.execute(db);
}
