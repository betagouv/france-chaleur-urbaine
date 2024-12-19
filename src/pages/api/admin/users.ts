import type { NextApiRequest } from 'next';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

const route = async (req: NextApiRequest) => {
  requireGetMethod(req);
  const users = await kdb
    .selectFrom('users')
    .select([
      'id',
      'email',
      'role',
      'active',
      'created_at',
      'last_connection',
      'gestionnaires',
      sql<boolean>`from_api IS NOT NULL`.as('from_api'),
    ])
    .orderBy('id')
    .execute();
  return users;
};

export default handleRouteErrors(route, {
  requireAuthentication: ['admin'],
});

export type AdminManageUserItem = Awaited<ReturnType<typeof route>>[number];
