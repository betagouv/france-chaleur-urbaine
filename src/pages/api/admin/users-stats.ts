import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = async () => {
  // note that we exclude admins from stats
  const stats = await kdb
    .selectFrom('users')
    .select((eb) => [
      kdb.fn
        .count<number>('id')
        .filterWhere(eb.ref('last_connection'), '>=', sql.raw<Date>("NOW() - INTERVAL '3 HOUR'"))
        .filterWhere('role', '<>', 'admin')
        .as('last3h'),
      kdb.fn
        .count<number>('id')
        .filterWhere(eb.ref('last_connection'), '>=', sql.raw<Date>("NOW() - INTERVAL '24 HOUR'"))
        .filterWhere('role', '<>', 'admin')
        .as('last24h'),
      kdb.fn
        .count<number>('id')
        .filterWhere(eb.ref('last_connection'), '>=', sql.raw<Date>("NOW() - INTERVAL '7 DAY'"))
        .filterWhere('role', '<>', 'admin')
        .as('last7d'),
    ])
    .executeTakeFirstOrThrow();
  return stats;
};

export type AdminUsersStats = Awaited<ReturnType<typeof GET>>;

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
