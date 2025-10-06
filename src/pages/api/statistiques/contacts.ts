import type { NextApiRequest } from 'next';
import { z } from 'zod';

import db from '@/server/db';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { getAllDemands } from '@/server/services/manager';
import { STAT_KEY, STAT_LABEL, STAT_METHOD, STAT_PERIOD } from '@/types/enum/MatomoStats';
import type { Demand } from '@/types/Summary/Demand';

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
  return (acc: Record<string, CalcResult>, fields: Demand) => {
    const key = fields['Date demandes'];

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
    const results = await db('matomo_stats as s')
      .select(
        db.raw(
          `TO_CHAR(
              date::date, 'yyyy-mm-dd'
            ) as date`
        ),
        db.raw(
          `(SELECT s1.value
            FROM public.matomo_stats as s1
            WHERE s1.stat_label = '${STAT_LABEL.NB_ELIGIBLE}'
            AND s1.date = s.date
            AND s1.method = '${STAT_METHOD.AIRTABLE}'
            AND s1.stat_key = '${STAT_KEY.NB_CONTACTS}'
            AND s1.period = '${STAT_PERIOD.MONTHLY}' ) as "${STAT_LABEL.NB_ELIGIBLE}"`
        ),
        db.raw(
          `(SELECT s2.value
            FROM public.matomo_stats as s2
            WHERE s2.stat_label = '${STAT_LABEL.NB_UNELIGIBLE}'
            AND s2.date = s.date
            AND s2.method = '${STAT_METHOD.AIRTABLE}'
            AND s2.stat_key = '${STAT_KEY.NB_CONTACTS}'
            AND s2.period = '${STAT_PERIOD.MONTHLY}') as "${STAT_LABEL.NB_UNELIGIBLE}"`
        ),
        db.raw(
          `(SELECT s3.value
            FROM public.matomo_stats as s3
            WHERE s3.stat_label = '${STAT_LABEL.NB_TOTAL}'
            AND s3.date = s.date
            AND s3.method = '${STAT_METHOD.AIRTABLE}'
            AND s3.stat_key = '${STAT_KEY.NB_CONTACTS}'
            AND s3.period = '${STAT_PERIOD.MONTHLY}') as "${STAT_LABEL.NB_TOTAL}"`
        )
      )
      .where('s.method', STAT_METHOD.AIRTABLE)
      .andWhere('s.stat_key', STAT_KEY.NB_CONTACTS)
      .andWhere('s.period', STAT_PERIOD.MONTHLY)
      .orderBy('s.date', 'ASC')
      .groupBy('s.date');
    return results;
  }
});
