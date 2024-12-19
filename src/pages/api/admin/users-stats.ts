import type { NextApiRequest } from 'next';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

const route = async (req: NextApiRequest) => {
  requireGetMethod(req);

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

export default handleRouteErrors(route, {
  requireAuthentication: ['admin'],
});

export type AdminUsersStats = Awaited<ReturnType<typeof route>>;
