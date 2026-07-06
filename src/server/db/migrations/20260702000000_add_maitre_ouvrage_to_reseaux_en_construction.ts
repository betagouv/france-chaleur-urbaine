import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE zones_et_reseaux_en_construction
    ADD COLUMN IF NOT EXISTS "MO" character varying(254);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE zones_et_reseaux_en_construction
    DROP COLUMN IF EXISTS "MO";
  `.execute(db);
}
