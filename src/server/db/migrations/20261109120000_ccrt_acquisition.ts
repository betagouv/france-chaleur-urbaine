import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands_chaleur_renouvelable ADD COLUMN acquisition jsonb;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE demands_chaleur_renouvelable DROP COLUMN acquisition;
  `.execute(db);
}
