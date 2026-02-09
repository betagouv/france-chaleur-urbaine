import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.tags
    ADD COLUMN IF NOT EXISTS comment text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.tags
    DROP COLUMN IF EXISTS comment;
  `.execute(db);
}
