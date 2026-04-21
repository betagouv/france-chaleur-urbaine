import { sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { buildDemandQuery, enrichDemandForGestionnaire } from './helpers';

const logger = parentLogger.child({ module: 'demands/user-tracking' });

/**
 * Liste les demandes créées par un utilisateur (pour le suivi dans son espace perso),
 * enrichies avec le nombre d'emails échangés avec le gestionnaire.
 */
export const listByUser = async (userId: string) => {
  const startTime = Date.now();

  const records = await buildDemandQuery()
    .select((eb) =>
      eb
        .selectFrom('demand_emails')
        .select(eb.fn.count<number>('id').as('count'))
        .whereRef('demand_emails.demand_id', '=', 'demands.id')
        .as('email_count')
    )
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  logger.info('kdb.listByUser', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
    userId,
  });

  const demands = records.map(({ testAddress, email_count, ...demand }) => ({
    ...enrichDemandForGestionnaire({
      demand,
      testAddress,
    }),
    email_count: Number(email_count) || 0,
  }));

  return demands;
};
