import { type Selectable } from 'kysely';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { type FrontendType } from '@/utils/typescript';

const GET = async () => {
  const tests = await kdb
    .selectFrom('pro_eligibility_tests')
    .selectAll('pro_eligibility_tests')
    .innerJoin('users', 'users.id', 'pro_eligibility_tests.user_id')
    .where('deleted_at', 'is', null)
    .select((eb) => [
      eb.ref('users.email').as('user_email'),
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
    .orderBy('pro_eligibility_tests.created_at', 'desc')
    .execute();
  return tests;
};

export type AdminProEligibilityTestListItem = FrontendType<Selectable<Awaited<ReturnType<typeof GET>>[number]>>;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
