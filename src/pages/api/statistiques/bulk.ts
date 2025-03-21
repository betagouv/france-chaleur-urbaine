import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

const GET = async () => {
  return await kdb
    .selectFrom('matomo_stats as s')
    .select([
      sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'),
      (eb) =>
        eb
          .selectFrom('matomo_stats as s1')
          .select('s1.value')
          .where('s1.stat_label', '=', STAT_LABEL.NB_ELIGIBLE)
          .where('s1.date', '=', eb.ref('s.date'))
          .where('s1.method', '=', STAT_METHOD.DATABASE)
          .where('s1.stat_key', '=', STAT_KEY.BULK_CONTACTS)
          .where('s1.period', '=', STAT_PERIOD.MONTHLY)
          .as(STAT_LABEL.NB_ELIGIBLE),
      (eb) =>
        eb
          .selectFrom('matomo_stats as s2')
          .select('s2.value')
          .where('s2.stat_label', '=', STAT_LABEL.NB_UNELIGIBLE)
          .where('s2.date', '=', eb.ref('s.date'))
          .where('s2.method', '=', STAT_METHOD.DATABASE)
          .where('s2.stat_key', '=', STAT_KEY.BULK_CONTACTS)
          .where('s2.period', '=', STAT_PERIOD.MONTHLY)
          .as(STAT_LABEL.NB_UNELIGIBLE),
      (eb) =>
        eb
          .selectFrom('matomo_stats as s3')
          .select('s3.value')
          .where('s3.stat_label', '=', STAT_LABEL.NB_TOTAL)
          .where('s3.date', '=', eb.ref('s.date'))
          .where('s3.method', '=', STAT_METHOD.DATABASE)
          .where('s3.stat_key', '=', STAT_KEY.BULK_CONTACTS)
          .where('s3.period', '=', STAT_PERIOD.MONTHLY)
          .as(STAT_LABEL.NB_TOTAL),
    ])
    .where('s.method', '=', STAT_METHOD.DATABASE)
    .where('s.stat_key', '=', STAT_KEY.BULK_CONTACTS)
    .where('s.period', '=', STAT_PERIOD.MONTHLY)
    .orderBy('s.date', 'asc')
    .groupBy('s.date')
    .execute();
};

export default handleRouteErrors({ GET });
