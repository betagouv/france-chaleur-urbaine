import { handleRouteErrors } from '@helpers/server';
import db from 'src/db';
import { MatomoUniqueVisitorsMetrics } from 'src/services/matomo_types';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from 'src/types/enum/MatomoStats';

import { bulkFetchRangeFromMatomo } from '../../../services/matomo';

export default handleRouteErrors(async () => {
  let results = await bulkFetchRangeFromMatomo<MatomoUniqueVisitorsMetrics>({
    method: 'VisitsSummary.getUniqueVisitors',
    period: 'month',
  });

  //Saved from previous Matomo
  const visitsFromDB = await db('matomo_stats')
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

  if (visitsFromDB) {
    results = results ? visitsFromDB.concat(results) : visitsFromDB;
  }
  return results;
});
