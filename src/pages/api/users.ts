import type { NextApiRequest } from 'next';

import db from '@/server/db';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requireGetMethod(req);
    const users = await db('users')
      .select(['email', 'last_connection'])
      .whereNotNull('last_connection')
      .andWhere('active', true)
      .orderBy('last_connection', 'desc');
    return users;
  },
  {
    requireAuthentication: ['admin'],
  }
);
