import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { ensureValidPermissions } from '@/pages/api/pro-eligibility-tests/[id]';
import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { zRenameProEligibilityTestRequest } from '@/validation/pro-eligibility-test';

const POST = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  const { name } = await zRenameProEligibilityTestRequest.parseAsync(req.body);

  await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      name,
    })
    .execute();
};

export default handleRouteErrors(
  { POST },
  {
    requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'],
  }
);
