import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_COMMUNES_SANS_RESEAU, STAT_KEY, type STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

export type Statistiques = Awaited<ReturnType<typeof statistiques>>;
/**
 * Generates a query to fetch statistics for multiple labels from matomo_stats
 * @param eventKeys Array of stat labels to fetch
 * @returns Query result with date and values for each label
 */
export const getStats =
  <T extends string[]>({ period, method }: { period: `${STAT_PERIOD}`; method?: `${STAT_METHOD}` }) =>
  async (eventKeys: T) => {
    let query = kdb
      .selectFrom('matomo_stats as s')
      .select([
        sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'),
        sql<number>`value`.as('value'),
        sql<string>`stat_key`.as('stat_key'),
      ])
      .where('s.stat_key', 'in', eventKeys)
      .where('s.period', '=', period)
      .orderBy('s.date', 'asc');

    if (method) {
      query = query.where('s.method', '=', method);
    }

    const rawResults: { stat_key: T[number]; date: string; value: number }[] = await query.execute();

    const groupedResults = rawResults.reduce(
      (acc, { stat_key, date, value }) => {
        if (!acc[stat_key]) {
          acc[stat_key] = [];
        }
        acc[stat_key].push({ date, value });
        return acc;
      },
      {} as Record<T[number], { date: string; value: number }[]>
    );

    return groupedResults;
  };

const getDaily = getStats({ period: STAT_PERIOD.DAILY });
const getMonthly = getStats({ period: STAT_PERIOD.MONTHLY });

const statistiques = async () => {
  const comptesProCreated = await getDaily([STAT_KEY.NB_ACCOUNTS_PRO_CREATED, STAT_KEY.NB_ACCOUNTS_PARTICULIER_CREATED] as const);

  const nbComptesPro = comptesProCreated[STAT_KEY.NB_ACCOUNTS_PRO_CREATED].reduce((acc, curr) => acc + curr.value, 0);
  const nbComptesParticulier = comptesProCreated[STAT_KEY.NB_ACCOUNTS_PARTICULIER_CREATED].reduce((acc, curr) => acc + curr.value, 0);

  const communesSansReseauTestees = await getMonthly([STAT_COMMUNES_SANS_RESEAU.NB_TESTS, STAT_COMMUNES_SANS_RESEAU.NB_DEMANDES] as const);

  const nbCommunesSansReseauTestees = communesSansReseauTestees[STAT_COMMUNES_SANS_RESEAU.NB_TESTS].reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const nbCommunesSansReseauAccompagnees = communesSansReseauTestees[STAT_COMMUNES_SANS_RESEAU.NB_DEMANDES].reduce(
    (acc, curr) => acc + curr.value,
    0
  );

  return {
    communesSansReseau: {
      accompagnees: { total: nbCommunesSansReseauAccompagnees },
      testees: { total: nbCommunesSansReseauTestees },
    },
    comptes: {
      particuliers: { total: nbComptesParticulier },
      professionnels: { total: nbComptesPro },
    },
  };
};

export default handleRouteErrors(statistiques);
