import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// The Airtable base is decommissioned: the ids of the original records no longer point to anything.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE demands DROP COLUMN airtable_id;
    ALTER TABLE demand_emails DROP COLUMN airtable_id;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE demands ADD COLUMN airtable_id text;
    ALTER TABLE demand_emails ADD COLUMN airtable_id text;
  `.execute(db);
}
