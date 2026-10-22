import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Regroupe les préférences utilisateur dans une colonne JSONB `users.preferences`
 * (schéma zod `zUserPreferences`) : signature d'email et notifications de demandes,
 * avec la fréquence des nouvelles demandes (quotidien / hebdomadaire / aucune).
 * Remplace `signature`, `receive_new_demands` et `receive_old_demands`.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users
      ADD COLUMN preferences jsonb NOT NULL
      DEFAULT '{"email_signature": null, "notifications": {"new_demands": "daily", "pending_demands_reminder": true}}'::jsonb;

    -- NULL on the legacy flags excluded the account from the crons: preserve that as 'none' / false
    UPDATE users SET preferences = jsonb_build_object(
      'email_signature', signature,
      'notifications', jsonb_build_object(
        'new_demands', CASE WHEN receive_new_demands IS TRUE THEN 'daily' ELSE 'none' END,
        'pending_demands_reminder', coalesce(receive_old_demands, false)
      )
    );

    ALTER TABLE users
      DROP COLUMN signature,
      DROP COLUMN receive_new_demands,
      DROP COLUMN receive_old_demands;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE users
      ADD COLUMN signature text,
      ADD COLUMN receive_new_demands boolean,
      ADD COLUMN receive_old_demands boolean;

    UPDATE users SET
      signature = preferences->>'email_signature',
      receive_new_demands = preferences->'notifications'->>'new_demands' <> 'none',
      receive_old_demands = (preferences->'notifications'->>'pending_demands_reminder')::boolean;

    ALTER TABLE users DROP COLUMN preferences;
  `.execute(db);
}
