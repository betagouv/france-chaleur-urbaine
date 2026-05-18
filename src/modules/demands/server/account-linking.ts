import { createUserEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';

/**
 * Rattache les demandes anonymes existantes (matching par email) à un utilisateur.
 * Typiquement appelé à la création ou vérification d'un compte.
 */
export async function linkDemandsByEmail(userId: string, email: string) {
  const { numUpdatedRows } = await kdb
    .updateTable('demands')
    .set({ user_id: userId })
    .where('user_id', 'is', null)
    .where(sql`LOWER(legacy_values->>'Mail')`, '=', email.toLowerCase())
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  const count = Number(numUpdatedRows ?? 0);

  if (count) {
    await createUserEvent({
      author_id: userId,
      context_id: userId,
      context_type: 'user',
      data: { count, email },
      type: 'demand_linked_to_user',
    });
  }

  return count;
}
