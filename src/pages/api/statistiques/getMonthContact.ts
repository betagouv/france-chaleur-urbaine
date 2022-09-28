import { getDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';

const defaultMonthValue = {
  nbTotal: 0,
  nbEligible: 0,
  nbUneligible: 0,
};

const get = async (res: NextApiResponse) => {
  const demands = (await getDemands())?.reverse()?.reduce((acc, fields) => {
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
  }, {});
  return res.status(200).json(demands);
};

export default async function demands(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      return get(res);
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
