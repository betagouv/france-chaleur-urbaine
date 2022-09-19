import { getDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';

const get = async (res: NextApiResponse) => {
  let nbTotal = 0;
  let nbEligible = 0;
  let nbUneligible = 0;

  const demands = (await getDemands())?.reverse()?.reduce((acc, fields) => {
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
