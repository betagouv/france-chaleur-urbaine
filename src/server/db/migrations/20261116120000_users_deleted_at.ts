import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Soft deletion of accounts: the row stays in `users` with `deleted_at` and an anonymized email, so the audit events
 * of the account are kept. The events about an account no longer carry its real email: this applies the rule to the
 * accounts deleted or anonymized before it existed.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users ADD COLUMN deleted_at timestamptz;
    COMMENT ON COLUMN users.deleted_at IS 'Date de suppression du compte : la ligne reste, anonymisée, pour ses événements d''audit ; null = compte existant';

    -- accounts hard-deleted in the past, known only by the events about them: the address a deleted account gets today
    UPDATE events
    SET data = data
      || CASE WHEN data ? 'user_email'
        THEN jsonb_build_object('user_email', 'supprime-' || context_id || '@' || split_part(data->>'user_email', '@', 2) || '.invalid')
        ELSE '{}'::jsonb END
      || CASE WHEN data ? 'email'
        THEN jsonb_build_object('email', 'supprime-' || context_id || '@' || split_part(data->>'email', '@', 2) || '.invalid')
        ELSE '{}'::jsonb END
      || CASE WHEN jsonb_typeof(data->'changes') = 'object'
        THEN jsonb_build_object('changes', (SELECT coalesce(jsonb_object_agg(field, 'null'::jsonb), '{}'::jsonb) FROM jsonb_object_keys(data->'changes') AS field))
        ELSE '{}'::jsonb END
    WHERE context_type = 'user'
      AND context_id IS NOT NULL
      AND (data ? 'user_email' OR data ? 'email' OR data ? 'changes')
      AND NOT EXISTS (SELECT 1 FROM users WHERE users.id::text = events.context_id);

    -- accounts anonymized by the retention rule: their events take the anonymized email of the row
    UPDATE events
    SET data = data
      || CASE WHEN data ? 'user_email' THEN jsonb_build_object('user_email', users.email) ELSE '{}'::jsonb END
      || CASE WHEN data ? 'email' THEN jsonb_build_object('email', users.email) ELSE '{}'::jsonb END
      || CASE WHEN jsonb_typeof(data->'changes') = 'object'
        THEN jsonb_build_object('changes', (SELECT coalesce(jsonb_object_agg(field, 'null'::jsonb), '{}'::jsonb) FROM jsonb_object_keys(data->'changes') AS field))
        ELSE '{}'::jsonb END
    FROM users
    WHERE events.context_type = 'user'
      AND events.context_id = users.id::text
      AND users.email LIKE 'anonymise-%'
      AND (data ? 'user_email' OR data ? 'email' OR data ? 'changes');
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Only the column is removed: the emails replaced in the events are permanently gone.
  await sql`
    ALTER TABLE users DROP COLUMN deleted_at;
  `.execute(db);
}
