import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

/**
 * Retourne une stat sur les visites du site.
 * Utilisé pour le dashboard ADEME.
 */
const GET = async () => {
  const visits = await kdb
    .selectFrom('matomo_stats')
    .select([sql<string>`TO_CHAR(date, 'yyyy-mm-dd')`.as('date'), sql<number>`SUM(value)`.as('value')])
    .where((eb) =>
      eb.and({
        method: STAT_METHOD.VISIT_SUMMARY,
        period: STAT_PERIOD.MONTHLY,
        stat_key: STAT_KEY.NB_UNIQ_VISITORS,
      })
    )
    .groupBy('date')
    .orderBy('date', 'asc')
    .execute();

  return [
    {
      description: 'Nombre de visites',
      stats: visits,
    },
  ];
};

export default handleRouteErrors({ GET });
