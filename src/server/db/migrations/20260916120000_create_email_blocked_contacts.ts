import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE public.email_blocked_contacts (
      email text PRIMARY KEY,
      reason_code text NOT NULL,
      blocked_at timestamptz NOT NULL,
      synced_at timestamptz NOT NULL DEFAULT now()
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS public.email_blocked_contacts;
  `.execute(db);
}
