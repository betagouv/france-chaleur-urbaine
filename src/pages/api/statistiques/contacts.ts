import { getAllDemands } from '@core/infrastructure/repository/manager';
import {
  handleRouteErrors,
  requireGetMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest } from 'next';
import { Demand } from 'src/types/Summary/Demand';
import { z } from 'zod';

type CalcResult = {
  date?: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const reducer = {
  all: () => {
    let nbTotal = 0;
    let nbEligible = 0;
    let nbUneligible = 0;
    return (acc: Record<string, CalcResult>, fields: Demand) => {
      const key = fields['Date demandes'];

      nbTotal++;
      if (
        fields['Éligibilité'] &&
        (!fields['Distance au réseau'] || fields['Distance au réseau'] <= 100)
      ) {
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
              nbTotal,
              nbEligible,
              nbUneligible,
            },
          };
    };
  },
  monthly: () => {
    const defaultMonthValue = {
      date: '',
      nbTotal: 0,
      nbEligible: 0,
      nbUneligible: 0,
    };
    return (acc: Record<string, CalcResult>, fields: Demand) => {
      const date = fields['Date demandes'];
      const [year, month] = date.split('-');

      const key = `${year}-${month}`;

      const value = {
        ...((acc as Record<string, typeof defaultMonthValue>)?.[key] ||
          defaultMonthValue),
      };

      value.date = key;
      value.nbTotal++;
      if (
        fields['Éligibilité'] &&
        (!fields['Distance au réseau'] || fields['Distance au réseau'] <= 100)
      ) {
        value.nbEligible++;
      } else {
        value.nbUneligible++;
      }

      return !date
        ? acc
        : {
            ...acc,
            [key]: value,
          };
    };
  },
};

export default handleRouteErrors(async function demands(req: NextApiRequest) {
  requireGetMethod(req);

  const { group } = await validateObjectSchema(req.query, {
    group: z.enum(['all', 'monthly']),
  });

  const demands = await getAllDemands();
  return await demands.reverse().reduce(reducer[group](), {});
});
