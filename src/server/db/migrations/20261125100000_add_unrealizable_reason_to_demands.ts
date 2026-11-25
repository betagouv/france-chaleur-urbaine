import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// Reason given when a demand is closed as « Non réalisable » (keys in `allUnrealizableReasons`, demands constants), cleared when the status changes.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands
      ADD COLUMN unrealizable_reason text,
      ADD COLUMN unrealizable_detail text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.demands
      DROP COLUMN IF EXISTS unrealizable_detail,
      DROP COLUMN IF EXISTS unrealizable_reason;
  `.execute(db);
}
