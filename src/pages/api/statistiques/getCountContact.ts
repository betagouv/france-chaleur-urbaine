import { getDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Demand } from 'src/types/Summary/Demand';

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
      if (fields['Éligibilité']) {
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

      value.nbTotal++;
      if (fields['Éligibilité']) {
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

const get = async (
  res: NextApiResponse,
  group: keyof typeof reducer = 'monthly'
) => {
  const defaultReducer = reducer.monthly;
  const demands = ((await getDemands()) as Demand[])
    .reverse()
    .reduce((reducer[group] || defaultReducer)(), {});
  return res.status(200).json(demands);
};

export default async function demands(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { group } = req.query;

  try {
    if (req.method === 'GET') {
      return get(res, group as keyof typeof reducer | undefined);
    }
    return res.status(501);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
