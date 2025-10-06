import type { NextApiRequest } from 'next';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const POST = async (req: NextApiRequest) => {
  const jobId = req.query.id as string;
  await kdb
    .updateTable('jobs')
    .set({
      result: null,
      status: 'pending',
      updated_at: new Date(),
    })
    .where('id', '=', jobId)
    .execute();
};

export default handleRouteErrors(
  { POST },
  {
    requireAuthentication: ['admin'],
  }
);
