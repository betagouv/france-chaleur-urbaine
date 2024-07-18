import type { NextApiRequest } from 'next';

import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import db from 'src/db';

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
