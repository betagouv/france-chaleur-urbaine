import { handleRouteErrors } from '@helpers/server';
import db from 'src/db';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PERIOD } from 'src/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  return await db('matomo_stats as s')
    .select(
      db.raw(
        `TO_CHAR(
              date::date, 'yyyy-mm-dd'
            ) as date`
      ),
      db.raw(
        `(SELECT s1.value
            FROM public.matomo_stats as s1
            WHERE s1.stat_label = '${STAT_LABEL.NB_ELIGIBLE}'
            AND s1.date = s.date
            AND s1.method = '${STAT_METHOD.DATABASE}'
            AND s1.stat_key = '${STAT_KEY.BULK_CONTACTS}'
            AND s1.period = '${STAT_PERIOD.MONTHLY}' ) as "${STAT_LABEL.NB_ELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s2.value
            FROM public.matomo_stats as s2
            WHERE s2.stat_label = '${STAT_LABEL.NB_UNELIGIBLE}'
            AND s2.date = s.date
            AND s2.method = '${STAT_METHOD.DATABASE}'
            AND s2.stat_key = '${STAT_KEY.BULK_CONTACTS}'
            AND s2.period = '${STAT_PERIOD.MONTHLY}') as "${STAT_LABEL.NB_UNELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s3.value
            FROM public.matomo_stats as s3
            WHERE s3.stat_label = '${STAT_LABEL.NB_TOTAL}'
            AND s3.date = s.date
            AND s3.method = '${STAT_METHOD.DATABASE}'
            AND s3.stat_key = '${STAT_KEY.BULK_CONTACTS}'
            AND s3.period = '${STAT_PERIOD.MONTHLY}') as "${STAT_LABEL.NB_TOTAL}"`
      )
    )
    .where('s.method', STAT_METHOD.DATABASE)
    .andWhere('s.stat_key', STAT_KEY.BULK_CONTACTS)
    .andWhere('s.period', STAT_PERIOD.MONTHLY)
    .orderBy('s.date', 'ASC')
    .groupBy('s.date');
});
