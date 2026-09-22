import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Normalise les emails utilisateurs créés via l'admin avant que les transforms zod (trim + lowercase)
 * ne soient réellement appliqués côté serveur. Les lignes dont la version normalisée entre en conflit
 * avec un autre compte sont laissées telles quelles (à traiter manuellement).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE public.users u
    SET email = lower(trim(u.email))
    WHERE u.email <> lower(trim(u.email))
      AND NOT EXISTS (SELECT 1 FROM public.users u2 WHERE u2.email = lower(trim(u.email)) AND u2.id <> u.id);
  `.execute(db);
}

export async function down(): Promise<void> {
  // Irréversible : la casse d'origine n'est pas conservée.
}
