import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    -- the column only ever held the newsletter consent date; CGU acceptance lives in accepted_cgu_at
    ALTER TABLE users RENAME COLUMN optin_at TO newsletter_optin_at;
    ALTER INDEX idx_users_optin_at RENAME TO idx_users_newsletter_optin_at;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER INDEX idx_users_newsletter_optin_at RENAME TO idx_users_optin_at;
    ALTER TABLE users RENAME COLUMN newsletter_optin_at TO optin_at;
  `.execute(db);
}
