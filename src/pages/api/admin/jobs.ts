import { jsonBuildObject } from 'kysely/helpers/postgres';

import { kdb } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import type { FrontendType } from '@/utils/typescript';

const GET = async () => {
  const jobs = await kdb
    .selectFrom('jobs')
    .leftJoin('users', 'users.id', 'jobs.user_id')
    .select([
      'jobs.id',
      'jobs.status',
      'jobs.type',
      'jobs.entity_id',
      'jobs.user_id',
      'jobs.result',
      'jobs.created_at',
      'jobs.updated_at',
      (eb) =>
        jsonBuildObject({
          email: eb.ref('users.email'),
          id: eb.ref('users.id'),
        }).as('user'),
    ])
    .orderBy('jobs.updated_at desc')
    .execute();
  return jobs;
};

export type AdminJobItem = FrontendType<Awaited<ReturnType<typeof GET>>[number]>;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
