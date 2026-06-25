import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE demands ADD COLUMN IF NOT EXISTS pending_assignment_change JSONB;
    CREATE INDEX IF NOT EXISTS idx_demands_pending_assignment_change ON demands (id) WHERE pending_assignment_change IS NOT NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS idx_demands_pending_assignment_change;
    ALTER TABLE demands DROP COLUMN IF EXISTS pending_assignment_change;
  `.execute(db);
}
