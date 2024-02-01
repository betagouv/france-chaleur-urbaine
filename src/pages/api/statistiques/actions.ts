import db from 'src/db';
import { fetchFromMatomo } from '../../../services/matomo';
import { handleRouteErrors } from '@helpers/server';
import { STAT_KEY, STAT_METHOD, STAT_PERIOD } from 'src/types/enum/MatomoStats';

export default handleRouteErrors(async () => {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const display = 12 * (year - 2024) + month;
  currentDate.setMonth(currentDate.getMonth() - 1);
  currentDate.setDate(1);
  let results;

  if (display >= 1) {
    const actionsFromMatomo = await fetchFromMatomo(
      {
        method: 'Events.getAction',
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
    if (actionsFromMatomo.error) {
      return { results: actionsFromMatomo };
    }
    console.log('actionsFromMatomo');
    console.log(actionsFromMatomo);
    if (actionsFromMatomo?.values) {
      results = actionsFromMatomo?.values.map((arr: any[], i: number) =>
        arr.reduce(
          (acc, entry) => {
            return {
              ...acc,
              [entry.label]: entry.nb_events,
            };
          },
          { date: actionsFromMatomo?.filters[i].date }
        )
      );
    }
  }

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

  console.log('actionsFromDB');
  console.log(actionsFromDB);
  if (actionsFromDB) {
    results = results ? actionsFromDB.concat(results) : actionsFromDB;
  }
  console.log('results');
  console.log(results);

  return { results };
});
