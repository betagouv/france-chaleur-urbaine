import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands_chaleur_renouvelable
      ADD COLUMN reopened_at timestamptz,
      DROP CONSTRAINT demands_chaleur_renouvelable_archive_reason_check,
      ADD CONSTRAINT demands_chaleur_renouvelable_archive_reason_check
        CHECK (archive_reason IN ('individual_house', 'individual_heating', 'uncovered_department', 'test', 'duplicate', 'other'));
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands_chaleur_renouvelable
      DROP COLUMN reopened_at,
      DROP CONSTRAINT demands_chaleur_renouvelable_archive_reason_check,
      ADD CONSTRAINT demands_chaleur_renouvelable_archive_reason_check
        CHECK (archive_reason IN ('individual_house', 'individual_heating', 'uncovered_department', 'test', 'other'));
  `.execute(db);
}
