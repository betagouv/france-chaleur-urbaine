import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE reseaux_de_chaleur
    ADD COLUMN IF NOT EXISTS ecoreseau character varying(255);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE reseaux_de_chaleur
    DROP COLUMN IF EXISTS ecoreseau;
  `.execute(db);
}
