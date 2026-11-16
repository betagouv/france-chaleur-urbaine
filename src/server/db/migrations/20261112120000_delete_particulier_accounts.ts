import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * The particulier role has been removed from the application: demands are tracked by email without an account.
 * Its accounts are deleted with their audit events, which only trace the life of the account (the events they
 * authored follow the foreign key cascade). Demands are kept (`demands.user_id` becomes NULL); bulk tests, jobs and
 * comparator configurations go with the account.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DELETE FROM events
    WHERE context_type = 'user' AND context_id IN (SELECT id::text FROM users WHERE role = 'particulier');

    -- event types of the phase-out, removed from the application
    DELETE FROM events WHERE type IN ('user_particulier_deletion_announced', 'user_particulier_accounts_deleted');

    DELETE FROM users WHERE role = 'particulier';
  `.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Irreversible: the accounts and their dependent rows are permanently deleted.
}
