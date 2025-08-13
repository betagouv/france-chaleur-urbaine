import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { createUserEvent } from '@/server/services/events';

export type ProEligibilityTestWithAddresses = Awaited<ReturnType<typeof GET>>;

const GET = async (req: NextApiRequest) => {
  const testId = await z.string().parseAsync(req.query.id);
  // admins can see all tests
  if (req.user.role !== 'admin') {
    ensureValidPermissions(req, testId);
  }

  const eligibilityTest = await kdb.selectFrom('pro_eligibility_tests').where('id', '=', testId).selectAll().executeTakeFirstOrThrow();

  const addresses = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .where('test_id', '=', testId)
    .selectAll()
    .select([sql`ST_AsGeoJSON(st_transform(geom, 4326))::json`.as('geom')])
    .execute();

  return {
    ...eligibilityTest,
    addresses: addresses.map((address) => ({
      ...address,
      eligibility_status: {
        ...address.eligibility_status,
        etat_reseau:
          address.eligibility_status === null || !address.eligibility_status || !address.eligibility_status?.isEligible
            ? 'aucun'
            : address.eligibility_status.futurNetwork
              ? 'en_construction'
              : 'existant',
      },
    })),
  };
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

  await createUserEvent({
    type: 'pro_eligibility_test_deleted',
    context_type: 'pro_eligibility_test',
    context_id: testId,
    author_id: req.user.id,
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

  await createUserEvent({
    type: 'pro_eligibility_test_updated',
    context_type: 'pro_eligibility_test',
    context_id: testId,
    author_id: req.user.id,
  });
};

export default handleRouteErrors(
  { GET, DELETE, POST },
  {
    requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'],
  }
);

export async function ensureValidPermissions(req: NextApiRequest, testId: string) {
  const test = await kdb.selectFrom('pro_eligibility_tests').select('user_id').where('id', '=', testId).executeTakeFirstOrThrow();
  if (test.user_id !== req.user.id) {
    throw new Error('permissions invalides');
  }
}
