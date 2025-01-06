import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, invalidRouteError } from '@/server/helpers/server';

const GET = async (req: NextApiRequest) => {
  const id = await z.string().parseAsync(req.query.id);
  const eligibilityTest = await kdb.selectFrom('pro_eligibility_tests').where('id', '=', id).selectAll().executeTakeFirstOrThrow();
  // TODO récupérer les adresses également
  return eligibilityTest;
};

const DELETE = async (req: NextApiRequest) => {
  const id = await z.string().parseAsync(req.query.id);
  await kdb.deleteFrom('pro_eligibility_tests').where('id', '=', id).executeTakeFirstOrThrow();
};

const route = async (req: NextApiRequest) => {
  if (req.method === 'GET') {
    return GET(req);
  }
  if (req.method === 'DELETE') {
    return DELETE(req);
  }
  throw invalidRouteError;
};

export default handleRouteErrors(route, {
  requireAuthentication: ['professionnel'],
});
