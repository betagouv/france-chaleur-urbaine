import db from 'src/db';
import { fetchFromMatomo } from '../../../services/matomo';
import { handleRouteErrors } from '@helpers/server';
import {
  STAT_KEY,
  STAT_METHOD,
  STAT_PARAMS,
  STAT_PERIOD,
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
        method: 'Actions.getPageUrl',
        pageUrl: '/carte',
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
    console.log('visitsFromMatomo MAP');
    console.log(visitsFromMatomo);
    results = visitsFromMatomo?.values?.map((arr: any[], i: number) =>
      arr.reduce(
        (acc, entry) => {
          return {
            ...acc,
            value: entry.nb_visits,
          };
        },
        { date: visitsFromMatomo?.filters[i].date }
      )
    );
  }

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
    .where('method', STAT_METHOD.MAP_VISIT_SUMMARY)
    .andWhere('method_params', STAT_PARAMS.URL)
    .andWhere('stat_key', STAT_KEY.NB_VISITS)
    .andWhere('period', STAT_PERIOD.MONTHLY)
    .orderBy('date', 'ASC');

  if (visitsFromDB) {
    results = results ? visitsFromDB.concat(results) : visitsFromDB;
  }

  return { results };
});
