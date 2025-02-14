import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { ensureValidPermissions } from '@/pages/api/pro-eligibility-tests/[id]';
import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';

const route = async (req: NextApiRequest) => {
  requirePostMethod(req);
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      has_unseen_results: false,
    })
    .execute();
};

export default handleRouteErrors(route, {
  requireAuthentication: ['professionnel'],
});
