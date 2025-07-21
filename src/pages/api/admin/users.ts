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
      'status',
      'first_name',
      'last_name',
      'phone',
      'structure_name',
      'structure_type',
      'structure_other',
      'optin_at',
      'created_at',
      'last_connection',
      'gestionnaires',
      sql<boolean>`coalesce(receive_new_demands, false)`.as('receive_new_demands'),
      sql<boolean>`coalesce(receive_old_demands, false)`.as('receive_old_demands'),
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
