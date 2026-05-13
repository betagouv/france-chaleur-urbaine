import { sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { buildDemandQuery, enrichDemandForGestionnaire } from './helpers';

const logger = parentLogger.child({ module: 'demands/user-tracking' });

/**
 * Liste les demandes créées par un utilisateur (pour le suivi dans son espace perso).
 */
export const listByUser = async (userId: string) => {
  const startTime = Date.now();

  const records = await buildDemandQuery()
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  logger.info('kdb.listByUser', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
    userId,
  });

  return records.map(({ testAddress, ...demand }) => enrichDemandForGestionnaire({ demand, testAddress }));
};
