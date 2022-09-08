import { getDemands } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function demands(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const session = await getSession({ req });

    if (!session?.user?.email) {
      return res.status(204).json([]);
    }

    const demands = await getDemands(session.user.email);
    return res.status(200).json(demands);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
