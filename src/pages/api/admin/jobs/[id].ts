import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const DELETE = async (req: NextApiRequest) => {
  const jobId = await z.string().parseAsync(req.query.id);
  await kdb.deleteFrom('jobs').where('id', '=', jobId).execute();
};

export default handleRouteErrors(
  { DELETE },
  {
    requireAuthentication: ['admin'],
  }
);
