import { type Selectable } from 'kysely';
import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb, type ProEligibilityTests, type ProEligibilityTestsAddresses } from '@/server/db/kysely';
import { handleRouteErrors, invalidRouteError } from '@/server/helpers/server';

export type ProEligibilityTestWithAddresses = Selectable<ProEligibilityTests> & {
  addresses: Selectable<ProEligibilityTestsAddresses>[];
};

const GET = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  const eligibilityTest = await kdb
    .selectFrom('pro_eligibility_tests')
    .where('user_id', '=', req.user.id)
    .where('id', '=', testId)
    .selectAll()
    .executeTakeFirstOrThrow();
  const addresses = await kdb.selectFrom('pro_eligibility_tests_addresses').where('test_id', '=', testId).selectAll().execute();
  return { ...eligibilityTest, addresses };
};

const DELETE = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  await kdb.transaction().execute(async (trx) => {
    await trx.deleteFrom('pro_eligibility_tests_addresses').where('test_id', '=', testId).execute();
    await trx.deleteFrom('pro_eligibility_tests').where('id', '=', testId).execute();
  });
};

export const zProEligibilityTestFileRequest = z.strictObject({
  csvContent: z.string(),
});
export type ProEligibilityTestFileRequest = z.infer<typeof zProEligibilityTestFileRequest>;

const POST = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);
  const { csvContent } = await zProEligibilityTestFileRequest.parseAsync(req.body);

  await kdb
    .insertInto('jobs')
    .values({
      type: 'pro_eligibility_test',
      data: { csvContent },
      status: 'pending',
      entity_id: testId,
      user_id: req.user.id,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
};

const route = async (req: NextApiRequest) => {
  if (req.method === 'GET') {
    return GET(req);
  }
  if (req.method === 'DELETE') {
    return DELETE(req);
  }
  if (req.method === 'POST') {
    return POST(req);
  }
  throw invalidRouteError;
};

export default handleRouteErrors(route, {
  requireAuthentication: ['professionnel'],
});

async function ensureValidPermissions(req: NextApiRequest, testId: string) {
  const test = await kdb.selectFrom('pro_eligibility_tests').select('user_id').where('id', '=', testId).executeTakeFirstOrThrow();
  if (test.user_id !== req.user.id) {
    throw new Error('permissions invalides');
  }
}
