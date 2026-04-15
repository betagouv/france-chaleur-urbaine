/**
 * FUTURE MIGRATION — NOT YET ACTIVE
 *
 * This migration drops legacy tag-related columns and the assignment_rules table,
 * now replaced by the user_permissions system.
 *
 * Prerequisites before running:
 * - Verify no code reads users.gestionnaires or users.gestionnaires_from_api
 * - Verify no code reads legacy_values Gestionnaires/Affecté à fields for routing
 * - Verify ENGIE sync no longer writes tags (or has been adapted)
 * - Verify assignment_rules admin UI has been removed or disabled
 *
 * To activate: move to migrations/ and rename with a proper timestamp prefix.
 */
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS assignment_rules;
    ALTER TABLE users DROP COLUMN IF EXISTS gestionnaires;
    ALTER TABLE users DROP COLUMN IF EXISTS gestionnaires_from_api;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users ADD COLUMN gestionnaires TEXT DEFAULT '{}';
    ALTER TABLE users ADD COLUMN gestionnaires_from_api TEXT DEFAULT '{}';

    CREATE TABLE assignment_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      search_pattern TEXT NOT NULL,
      result TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `.execute(db);
}
