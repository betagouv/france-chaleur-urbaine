import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands_chaleur_renouvelable
      ADD COLUMN archived_at timestamptz,
      ADD COLUMN archive_reason text CHECK (archive_reason IN ('individual_house', 'individual_heating', 'uncovered_department', 'test', 'other')),
      ADD COLUMN archive_comment text,
      ADD COLUMN transferred_demand_id uuid REFERENCES demands(id) ON DELETE SET NULL,
      ADD COLUMN transferred_network_name text,
      ADD COLUMN admin_comment text NOT NULL DEFAULT '',
      ADD CONSTRAINT ccrt_archive_state CHECK (
        (archived_at IS NULL AND archive_reason IS NULL AND transferred_network_name IS NULL)
        OR (archived_at IS NOT NULL AND NOT validated AND ((archive_reason IS NOT NULL) <> (transferred_network_name IS NOT NULL)))
      );
    CREATE INDEX ccrt_demands_to_validate_idx ON demands_chaleur_renouvelable (created_at) WHERE NOT validated AND archived_at IS NULL;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DROP INDEX ccrt_demands_to_validate_idx;
    ALTER TABLE demands_chaleur_renouvelable
      DROP CONSTRAINT ccrt_archive_state,
      DROP COLUMN archived_at,
      DROP COLUMN archive_reason,
      DROP COLUMN archive_comment,
      DROP COLUMN transferred_demand_id,
      DROP COLUMN transferred_network_name,
      DROP COLUMN admin_comment;
  `.execute(db);
}
