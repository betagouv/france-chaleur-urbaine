import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.users
      ADD COLUMN totp_secret text,
      ADD COLUMN totp_enrolled_at timestamptz,
      ADD COLUMN totp_last_used_step bigint,
      ADD COLUMN totp_failed_attempts integer NOT NULL DEFAULT 0,
      ADD COLUMN totp_locked_until timestamptz;
    COMMENT ON COLUMN public.users.totp_secret IS 'Secret TOTP (second facteur des admins), chiffré AES-256-GCM avec ADMIN_MFA_ENCRYPTION_KEY ; null = pas de second facteur';
    COMMENT ON COLUMN public.users.totp_enrolled_at IS 'Date de confirmation du second facteur ; null avec un totp_secret = enrôlement en attente';
    COMMENT ON COLUMN public.users.totp_last_used_step IS 'Dernier pas de temps TOTP accepté, pour refuser le rejeu d''un code déjà utilisé';
    COMMENT ON COLUMN public.users.totp_failed_attempts IS 'Codes incorrects consécutifs, remis à zéro par un code valide ou par le verrouillage';
    COMMENT ON COLUMN public.users.totp_locked_until IS 'Vérification du second facteur refusée jusqu''à cette date après trop de codes incorrects';
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE public.users
      DROP COLUMN totp_secret,
      DROP COLUMN totp_enrolled_at,
      DROP COLUMN totp_last_used_step,
      DROP COLUMN totp_failed_attempts,
      DROP COLUMN totp_locked_until;
  `.execute(db);
}
