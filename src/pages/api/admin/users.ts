import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = async () => {
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
      sql<boolean>`optin_at IS NOT NULL`.as('optin_at'),
      sql<boolean>`from_api IS NOT NULL`.as('from_api'),
    ])
    .orderBy('id')
    .execute();
  return users;
};

export type AdminManageUserItem = Awaited<ReturnType<typeof GET>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
