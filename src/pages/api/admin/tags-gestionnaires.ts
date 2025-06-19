import type { NextApiRequest } from 'next';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { compareFrenchStrings } from '@/utils/strings';

const GET = async (req: NextApiRequest) => {
  requireGetMethod(req);

  const tags = await kdb
    .selectFrom('users')
    .select((eb) => [sql`unnest(${eb.ref('gestionnaires')})`.as('tag')])
    .distinct()
    .execute();
  return tags.map((t) => t.tag).sort(compareFrenchStrings as any);
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
