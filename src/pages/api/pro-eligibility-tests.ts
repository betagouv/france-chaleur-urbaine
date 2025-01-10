import { type NextApiRequest } from 'next';

import { zProEligibilityTestRequest } from '@/components/dashboard/DashboardProfessionnel';
import { kdb } from '@/server/db/kysely';
import { handleRouteErrors, invalidRouteError } from '@/server/helpers/server';

const GET = async (req: NextApiRequest) => {
  const eligibilityTests = await kdb.selectFrom('pro_eligibility_tests').where('user_id', '=', req.user.id).selectAll().execute();
  return eligibilityTests;
};

const POST = async (req: NextApiRequest) => {
  const { name, csvContent } = await zProEligibilityTestRequest.parseAsync(req.body);

  const createdEligibilityTestId = await kdb.transaction().execute(async (trx) => {
    const createdEligibilityTest = await trx
      .insertInto('pro_eligibility_tests')
      .values({
        name: name,
        user_id: req.user.id,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    await trx
      .insertInto('jobs')
      .values({
        type: 'pro_eligibility_test',
        data: { csvContent },
        status: 'pending',
        entity_id: createdEligibilityTest.id,
        user_id: req.user.id,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return createdEligibilityTest.id;
  });

  return {
    id: createdEligibilityTestId,
  };
};

const route = async (req: NextApiRequest) => {
  if (req.method === 'GET') {
    return GET(req);
  }
  if (req.method === 'POST') {
    return POST(req);
  }
  throw invalidRouteError;
};

export default handleRouteErrors(route, {
  requireAuthentication: ['professionnel'],
});
