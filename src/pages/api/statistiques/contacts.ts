import type { NextApiRequest } from 'next';
import { z } from 'zod';

import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { getAllDemands } from '@/server/services/manager';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';
import { dayjs } from '@/utils/date';

type CalcResult = {
  date?: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const reducer = () => {
  let nbTotal = 0;
  let nbEligible = 0;
  let nbUneligible = 0;
  return (acc: Record<string, CalcResult>, fields: AirtableLegacyRecord) => {
    const key = dayjs(fields['Date de la demande']).format('YYYY-MM-DD');

    nbTotal++;
    if (fields.Éligibilité && (!fields['Distance au réseau'] || fields['Distance au réseau'] <= 100)) {
      nbEligible++;
    } else {
      nbUneligible++;
    }

    return !key
      ? acc
      : {
          ...acc,
          [key]: {
            date: key,
            nbEligible,
            nbTotal,
            nbUneligible,
          },
        };
  };
};

export default handleRouteErrors(async function demands(req: NextApiRequest) {
  requireGetMethod(req);

  const { group } = await validateObjectSchema(req.query, {
    group: z.enum(['all', 'monthly']),
  });

  if (group === 'all') {
    return (await getAllDemands()).reverse().reduce(reducer(), {});
  } else {
    const results = await kdb
      .selectFrom('matomo_stats as s')
      .select([
        sql<string>`TO_CHAR(date::date, 'yyyy-mm-dd')`.as('date'),
        sql<number>`(SELECT s1.value
          FROM public.matomo_stats as s1
          WHERE s1.stat_label = ${STAT_LABEL.NB_ELIGIBLE}
          AND s1.date = s.date
          AND s1.method = ${STAT_METHOD.AIRTABLE}
          AND s1.stat_key = ${STAT_KEY.NB_CONTACTS}
          AND s1.period = ${STAT_PERIOD.MONTHLY})`.as(STAT_LABEL.NB_ELIGIBLE),
        sql<number>`(SELECT s2.value
          FROM public.matomo_stats as s2
          WHERE s2.stat_label = ${STAT_LABEL.NB_UNELIGIBLE}
          AND s2.date = s.date
          AND s2.method = ${STAT_METHOD.AIRTABLE}
          AND s2.stat_key = ${STAT_KEY.NB_CONTACTS}
          AND s2.period = ${STAT_PERIOD.MONTHLY})`.as(STAT_LABEL.NB_UNELIGIBLE),
        sql<number>`(SELECT s3.value
          FROM public.matomo_stats as s3
          WHERE s3.stat_label = ${STAT_LABEL.NB_TOTAL}
          AND s3.date = s.date
          AND s3.method = ${STAT_METHOD.AIRTABLE}
          AND s3.stat_key = ${STAT_KEY.NB_CONTACTS}
          AND s3.period = ${STAT_PERIOD.MONTHLY})`.as(STAT_LABEL.NB_TOTAL),
      ])
      .where('s.method', '=', STAT_METHOD.AIRTABLE)
      .where('s.stat_key', '=', STAT_KEY.NB_CONTACTS)
      .where('s.period', '=', STAT_PERIOD.MONTHLY)
      .orderBy('s.date', 'asc')
      .groupBy('s.date')
      .execute();
    return results;
  }
});
