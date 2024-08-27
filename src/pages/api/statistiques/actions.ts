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
        WHERE s1.stat_label = '${STAT_LABEL.FORM_TEST_ELIGIBLE}'
        AND s1.date = s.date) as "${STAT_LABEL.FORM_TEST_ELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s2.value
        FROM public.matomo_stats as s2
        WHERE s2.stat_label = '${STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE}'
        AND s2.date = s.date) as "${STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s3.value
        FROM public.matomo_stats as s3
        WHERE s3.stat_label = '${STAT_LABEL.FORM_TEST_UNELIGIBLE}'
        AND s3.date = s.date) as "${STAT_LABEL.FORM_TEST_UNELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s4.value
        FROM public.matomo_stats as s4
        WHERE s4.stat_label = '${STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE}'
        AND s4.date = s.date) as "${STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s5.value
        FROM public.matomo_stats as s5
        WHERE s5.stat_label = '${STAT_LABEL.TRACES}'
        AND s5.date = s.date) as "${STAT_LABEL.TRACES}"`
      ),
      db.raw(
        `(SELECT s6.value
        FROM public.matomo_stats as s6
        WHERE s6.stat_label = '${STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE}'
        AND s6.date = s.date) as "${STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE}"`
      ),
      db.raw(
        `(SELECT s7.value
        FROM public.matomo_stats as s7
        WHERE s7.stat_label = '${STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE}'
        AND s7.date = s.date) as "${STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE}"`
      )
    )
    .where('s.method', STAT_METHOD.ACTIONS)
    .andWhere('s.stat_key', STAT_KEY.NB_EVENTS)
    .andWhere('s.period', STAT_PERIOD.MONTHLY)
    .orderBy('s.date', 'ASC')
    .groupBy('s.date');
});
