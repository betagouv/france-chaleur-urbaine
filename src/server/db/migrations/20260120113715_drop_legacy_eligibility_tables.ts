import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS eligibility_demands_addresses CASCADE;
    DROP TABLE IF EXISTS eligibility_demands CASCADE;
    DROP TABLE IF EXISTS eligibility_tests CASCADE;
  `.execute(db);
}

export async function down() {}
