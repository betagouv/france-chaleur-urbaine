import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  return await kdb
    .selectFrom('matomo_stats')
    .select([sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'), 'value'])
    .where('method', '=', STAT_METHOD.VISIT_SUMMARY)
    .where('stat_key', '=', STAT_KEY.NB_UNIQ_VISITORS)
    .where('period', '=', STAT_PERIOD.MONTHLY)
    .orderBy('date', 'asc')
    .execute();
});
