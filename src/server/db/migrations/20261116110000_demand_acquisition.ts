import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Keeps acquisition snapshots separate from legacy campaign fields; historical rows remain untouched. */
export async function up(database: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE demands ADD COLUMN acquisition jsonb;`.execute(database);
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE demands DROP COLUMN acquisition;`.execute(database);
}
