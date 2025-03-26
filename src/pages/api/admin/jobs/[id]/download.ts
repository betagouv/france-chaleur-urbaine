import { type NextApiRequest } from 'next';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = async (req: NextApiRequest) => {
  const jobId = req.query.id as string;
  const job = await kdb.selectFrom('jobs').where('id', '=', jobId).select(['data', 'type']).executeTakeFirstOrThrow();
  return job;
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
