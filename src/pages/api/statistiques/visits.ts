import db from '@/server/db';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  return await db('matomo_stats')
    .select(
      db.raw(
        `TO_CHAR(
          date::date, 'yyyy-mm-dd'
        ) as date`
      ),
      'value'
    )
    .where('method', STAT_METHOD.VISIT_SUMMARY)
    .andWhere('stat_key', STAT_KEY.NB_UNIQ_VISITORS)
    .andWhere('period', STAT_PERIOD.MONTHLY)
    .orderBy('date', 'ASC');
});
