import db from 'src/db';
import { fetchFromMatomo } from '../../../services/matomo';
import { handleRouteErrors } from '@helpers/server';
import {
  STAT_PERIOD,
  STAT_METHOD,
  STAT_DATA,
} from 'src/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const display = 12 * (year - 2024) + month;
  currentDate.setMonth(currentDate.getMonth() - 1);
  currentDate.setDate(1);
  let results;

  if (display >= 1) {
    const visitsFromMatomo = await fetchFromMatomo(
      {
        method: 'VisitsSummary.getUniqueVisitors',
        period: 'month',
      },
      Array(display)
        .fill(null)
        .map((v, i) => {
          const baseDate = new Date(currentDate.toDateString());
          baseDate.setMonth(baseDate.getMonth() - i);
          const date = `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${baseDate
            .getDate()
            .toString()
            .padStart(2, '0')}`;
          return {
            date,
          };
        }),
      true
    );

    if (visitsFromMatomo.error) {
      return { results: visitsFromMatomo };
    }

    results =
      visitsFromMatomo?.values
        .map(
          (data: any, i: number) =>
            data.result !== 'error' && {
              date: visitsFromMatomo.filters[i].date,
              ...data,
            }
        )
        .reverse() ?? [];
  }

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
    .andWhere('stat_data', STAT_DATA.NB_UNIQ_VISITORS)
    .andWhere('period', STAT_PERIOD.MONTHLY)
    .orderBy('date', 'ASC');

  if (visitsFromDB) {
    results = results ? visitsFromDB.concat(results) : visitsFromDB;
  }
  return { results };
});
