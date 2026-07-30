import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- Creation date of the network, backfilled once from the Airtable "Date de création / mise en ligne" field
    ALTER TABLE zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS created_at;
  `.execute(db);
}
