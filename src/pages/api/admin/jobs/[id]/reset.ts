import { type NextApiRequest } from 'next';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, invalidRouteError } from '@/server/helpers/server';

const POST = async (req: NextApiRequest) => {
  const jobId = req.query.id as string;
  await kdb
    .updateTable('jobs')
    .set({
      status: 'pending',
      result: null,
      updated_at: new Date(),
    })
    .where('id', '=', jobId)
    .execute();
};

const route = async (req: NextApiRequest) => {
  if (req.method === 'POST') {
    return POST(req);
  }
  throw invalidRouteError;
};

export default handleRouteErrors(route, {
  requireAuthentication: ['admin'],
});
