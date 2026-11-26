import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    -- Every lookup of an account compares the stored email to a lowercased input, and users_email_unicity compares the exact
    -- text: with the email always stored in lowercase, that constraint also forbids two accounts differing only by case
    -- (the data diagnostic used to report them)
    ALTER TABLE users
    ADD CONSTRAINT users_email_lowercase CHECK (email = lower(email));
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE users
    DROP CONSTRAINT users_email_lowercase;
  `.execute(db);
}
