import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

export type ProEligibilityTestWithAddresses = Awaited<ReturnType<typeof GET>>;

const GET = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  const eligibilityTest = await kdb
    .selectFrom('pro_eligibility_tests')
    .where('user_id', '=', req.user.id)
    .where('id', '=', testId)
    .selectAll()
    .executeTakeFirstOrThrow();

  const addresses = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .where('test_id', '=', testId)
    .selectAll()
    .select([sql`ST_AsGeoJSON(st_transform(geom, 4326))::json`.as('geom')])
    .execute();
  return { ...eligibilityTest, addresses };
};

const DELETE = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  ensureValidPermissions(req, testId);

  await kdb
    .updateTable('pro_eligibility_tests')
    .where('id', '=', testId)
    .set({
      deleted_at: new Date(),
    })
    .execute();
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

export default handleRouteErrors(
  { GET, DELETE, POST },
  {
    requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin'],
  }
);

export async function ensureValidPermissions(req: NextApiRequest, testId: string) {
  const test = await kdb.selectFrom('pro_eligibility_tests').select('user_id').where('id', '=', testId).executeTakeFirstOrThrow();
  if (test.user_id !== req.user.id) {
    throw new Error('permissions invalides');
  }
}
