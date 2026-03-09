import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS communes_avec_ppa (
      code_insee character varying(6) UNIQUE
    );

    CREATE INDEX IF NOT EXISTS communes_avec_ppa_code_insee_idx
    ON communes_avec_ppa (code_insee);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS communes_avec_ppa;
  `.execute(db);
}
