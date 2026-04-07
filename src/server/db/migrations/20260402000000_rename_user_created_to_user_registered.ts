import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'user_registered'
    WHERE type = 'user_created'
      AND context_type = 'user';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET type = 'user_created'
    WHERE type = 'user_registered'
      AND context_type = 'user';
  `.execute(db);
}
