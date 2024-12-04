import type { NextApiRequest } from 'next';

import db from '@/server/db';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requireGetMethod(req);

    const tags = await db('users').distinct(db.raw('unnest(gestionnaires) as gestionnaire')).orderBy('gestionnaire');
    return tags.map(({ gestionnaire }) => gestionnaire);
  },
  {
    requireAuthentication: ['admin'],
  }
);
