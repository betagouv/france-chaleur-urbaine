import { type Selectable } from 'kysely';
import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { type FrontendType } from '@/utils/typescript';

const GET = async (req: NextApiRequest) => {
  const eligibilityTests = await kdb
    .selectFrom('pro_eligibility_tests')
    .where('user_id', '=', req.user.id)
    .selectAll()
    .select((eb) => [
      eb
        .exists(
          eb
            .selectFrom('jobs')
            .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
            .where('jobs.status', 'in', ['pending', 'processing'])
            .select('jobs.id')
        )
        .as('has_pending_jobs'),
      eb
        .selectFrom('jobs')
        .whereRef('jobs.entity_id', '=', 'pro_eligibility_tests.id')
        .select((eb) => eb.case().when('status', '=', 'error').then(true).else(false).end().as('has_error'))
        .orderBy('created_at', 'desc')
        .limit(1)
        .as('last_job_has_error'),
    ])
    .orderBy('created_at desc')
    .execute();
  return eligibilityTests;
};
export type ProEligibilityTestListItem = FrontendType<Selectable<Awaited<ReturnType<typeof GET>>[number]>>;

export const zProEligibilityTestCreateInput = z.strictObject({
  name: z.string(),
  csvContent: z.string(),
});
export type ProEligibilityTestCreateInput = z.infer<typeof zProEligibilityTestCreateInput>;

const POST = async (req: NextApiRequest) => {
  const { name, csvContent } = await zProEligibilityTestCreateInput.parseAsync(req.body);

  const createdEligibilityTestId = await kdb.transaction().execute(async (trx) => {
    const createdEligibilityTest = await trx
      .insertInto('pro_eligibility_tests')
      .values({
        name: name,
        user_id: req.user.id,
        has_unseen_results: false,
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

export type ProEligibilityTestCreateOutput = ReturnType<typeof POST>;

export default handleRouteErrors(
  { GET, POST },
  {
    requireAuthentication: ['professionnel'],
  }
);
