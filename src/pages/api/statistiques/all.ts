import { sql } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_COMMUNES_SANS_RESEAU, STAT_KEY, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

export type Statistiques = Awaited<ReturnType<typeof statistiques>>;
/**
 * Generates a query to fetch statistics for multiple labels from matomo_stats
 * @param eventKeys Array of stat labels to fetch
 * @returns Query result with date and values for each label
 */
export const getStatsForMethod =
  <T extends string[]>(method: `${STAT_METHOD}`) =>
  async (eventKeys: T) => {
    const query = kdb
      .selectFrom('matomo_stats as s')
      .select([
        sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'),
        sql<number>`value`.as('value'),
        sql<string>`stat_key`.as('stat_key'),
      ])
      .where('s.method', '=', method)
      .where('s.stat_key', 'in', eventKeys)
      .where('s.period', '=', STAT_PERIOD.MONTHLY)
      .orderBy('s.date', 'asc');

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

const getStatsForDatabase = getStatsForMethod(STAT_METHOD.DATABASE);
const getStatsForActions = getStatsForMethod(STAT_METHOD.ACTIONS);

const statistiques = async () => {
  const comptesProCreated = await getStatsForDatabase([
    STAT_KEY.NB_ACCOUNTS_PRO_CREATED,
    STAT_KEY.NB_ACCOUNTS_PARTICULIER_CREATED,
  ] as const);

  const nbComptesPro = comptesProCreated[STAT_KEY.NB_ACCOUNTS_PRO_CREATED].reduce((acc, curr) => acc + curr.value, 0);
  const nbComptesParticulier = comptesProCreated[STAT_KEY.NB_ACCOUNTS_PARTICULIER_CREATED].reduce((acc, curr) => acc + curr.value, 0);

  const communesSansReseauTestees = await getStatsForActions([
    STAT_COMMUNES_SANS_RESEAU.NB_TESTS,
    STAT_COMMUNES_SANS_RESEAU.NB_DEMANDES,
  ] as const);

  const nbCommunesSansReseauTestees = communesSansReseauTestees[STAT_COMMUNES_SANS_RESEAU.NB_TESTS].reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const nbCommunesSansReseauAccompagnees = communesSansReseauTestees[STAT_COMMUNES_SANS_RESEAU.NB_DEMANDES].reduce(
    (acc, curr) => acc + curr.value,
    0
  );

  return {
    comptes: {
      professionnels: { total: nbComptesPro },
      particuliers: { total: nbComptesParticulier },
    },
    communesSansReseau: {
      testees: { total: nbCommunesSansReseauTestees },
      accompagnees: { total: nbCommunesSansReseauAccompagnees },
    },
  };
};

export default handleRouteErrors(statistiques);
