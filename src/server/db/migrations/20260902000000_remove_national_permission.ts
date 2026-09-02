import type { Kysely } from 'kysely';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('migration:remove_national_permission');

/**
 * Supprime les permissions de type `national`, retirées de l'application
 * (remplacées par les portées réseau / territoire / organisation).
 */
export async function up(db: Kysely<any>): Promise<void> {
  const deleted = await db.deleteFrom('user_permissions').where('type', '=', 'national').executeTakeFirst();
  logger.info('permissions national supprimées', { count: Number(deleted.numDeletedRows) });
}

export async function down(): Promise<void> {
  // Irréversible : les permissions supprimées ne peuvent pas être restaurées.
}
