import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { bulkFetchRangeFromMatomo } from '@/server/services/matomo';
import { STAT_METHOD } from '@/types/enum/MatomoStats';
import { ObjectEntries } from '@/utils/typescript';

// https://www.notion.so/accelerateur-transition-ecologique-ademe/Route-stats-9ccb601c7b9649878b2568b175e86456#3dc132d893574c22b91b442b9f8b51ac

// output:
type StatOuput = {
  description?: string;
  stats: {
    /**
     * Valeur numérique de la stat demandée.
     * Mesure de la KPI.
     */
    value: number;
    /**
     * Date de la valeur format Datestring ou timestamp UTC (préféré)
     */
    date: string;
  }[];
};

const MIN_DATE = dayjs('2021-07-01');

const querySchema = {
  periodicity: z.enum(['day', 'week', 'month', 'year']).default('month'),
  since: z.coerce.number().optional().default(Number.MAX_SAFE_INTEGER),
} as const;

/**
 * Retourne une stat sur les visites du site.
 * Utilisé pour le dashboard ADEME.
 */
const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { periodicity, since } = await validateObjectSchema(req.query, querySchema);

  const paramStartDate = dayjs().subtract(since, periodicity);
  const startDate = paramStartDate.isValid() ? paramStartDate : MIN_DATE;

  // typage fonction non correct
  const results = await bulkFetchRangeFromMatomo<any>({
    date: `${startDate.format('YYYY-MM-DD')},${dayjs().format('YYYY-MM-DD')}`,
    method: STAT_METHOD.VISIT_SUMMARY,
    period: periodicity,
  });
  const stats = ObjectEntries(results[0])
    .filter(([key]) => key !== 'date') // supprime le champ ajouté inutile
    .map(([key, value]) => ({
      date: key,
      value: value as number,
    }));

  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
  return {
    description: 'Nombre de visites uniques',
    stats,
  } satisfies StatOuput;
};

export default handleRouteErrors({ GET });
