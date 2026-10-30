import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- free follow-up note written by the admins, never shown to the submitter
    ALTER TABLE network_change_requests ADD COLUMN internal_comment text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE network_change_requests DROP COLUMN internal_comment;
  `.execute(db);
}
