import db from 'src/db';
import { bulkFetchRangeFromMatomo } from '../../../services/matomo';
import { handleRouteErrors } from '@helpers/server';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from 'src/types/enum/MatomoStats';
import { MatomoActionMetrics } from 'src/services/matomo_types';

export default handleRouteErrors(async () => {
  let results = await bulkFetchRangeFromMatomo<MatomoActionMetrics>(
    {
      method: 'Events.getAction',
      period: 'month',
    },
    (entry) => ({ [entry.label]: entry.nb_events })
  );

  // Saved from previous Matomo
  const actionsFromDB = await db('matomo_stats as s')
    .select(
      db.raw(
        `TO_CHAR(
          date::date, 'yyyy-mm-dd'
        ) as date`
      ),
      db.raw(
        `(SELECT s1.value
        FROM public.matomo_stats as s1
        WHERE s1.stat_label = 'Formulaire de test - Adresse Éligible'
        AND s1.date = s.date) as "Formulaire de test - Adresse Éligible"`
      ),
      db.raw(
        `(SELECT s2.value
        FROM public.matomo_stats as s2
        WHERE s2.stat_label = 'Formulaire de test - Carte - Adresse Éligible'
        AND s2.date = s.date) as "Formulaire de test - Carte - Adresse Éligible"`
      ),
      db.raw(
        `(SELECT s3.value
        FROM public.matomo_stats as s3
        WHERE s3.stat_label = 'Formulaire de test - Adresse Inéligible'
        AND s3.date = s.date) as "Formulaire de test - Adresse Inéligible"`
      ),
      db.raw(
        `(SELECT s4.value
        FROM public.matomo_stats as s4
        WHERE s4.stat_label = 'Formulaire de test - Carte - Adresse Inéligible'
        AND s4.date = s.date) as "Formulaire de test - Carte - Adresse Inéligible"`
      ),
      db.raw(
        `(SELECT s5.value
        FROM public.matomo_stats as s5
        WHERE s5.stat_label = 'Tracés'
        AND s5.date = s.date) as "Tracés"`
      )
    )
    .where('s.method', STAT_METHOD.ACTIONS)
    .andWhere('s.stat_key', STAT_KEY.NB_EVENTS)
    .andWhere('s.period', STAT_PERIOD.MONTHLY)
    .orderBy('s.date', 'ASC')
    .groupBy('s.date');

  if (actionsFromDB) {
    results = results ? actionsFromDB.concat(results) : actionsFromDB;
  }

  return { results };
});
