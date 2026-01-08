import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  return await kdb
    .selectFrom('matomo_stats as s')
    .select([
      sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'),
      sql<number>`(SELECT s1.value FROM public.matomo_stats as s1 WHERE s1.stat_label = ${STAT_LABEL.FORM_TEST_ELIGIBLE} AND s1.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_ELIGIBLE
      ),
      sql<number>`(SELECT s2.value FROM public.matomo_stats as s2 WHERE s2.stat_label = ${STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE} AND s2.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE
      ),
      sql<number>`(SELECT s3.value FROM public.matomo_stats as s3 WHERE s3.stat_label = ${STAT_LABEL.FORM_TEST_UNELIGIBLE} AND s3.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_UNELIGIBLE
      ),
      sql<number>`(SELECT s4.value FROM public.matomo_stats as s4 WHERE s4.stat_label = ${STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE} AND s4.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE
      ),
      sql<number>`(SELECT s5.value FROM public.matomo_stats as s5 WHERE s5.stat_label = ${STAT_LABEL.TRACES} AND s5.date = s.date)`.as(
        STAT_LABEL.TRACES
      ),
      sql<number>`(SELECT s6.value FROM public.matomo_stats as s6 WHERE s6.stat_label = ${STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE} AND s6.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE
      ),
      sql<number>`(SELECT s7.value FROM public.matomo_stats as s7 WHERE s7.stat_label = ${STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE} AND s7.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE
      ),
      sql<number>`(SELECT s8.value FROM public.matomo_stats as s8 WHERE s8.stat_label = ${STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE} AND s8.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE
      ),
      sql<number>`(SELECT s9.value FROM public.matomo_stats as s9 WHERE s9.stat_label = ${STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE} AND s9.date = s.date)`.as(
        STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE
      ),
    ])
    .where('s.method', '=', STAT_METHOD.ACTIONS)
    .where('s.stat_key', '=', STAT_KEY.NB_EVENTS)
    .where('s.period', '=', STAT_PERIOD.MONTHLY)
    .orderBy('s.date', 'asc')
    .groupBy('s.date')
    .execute();
});
