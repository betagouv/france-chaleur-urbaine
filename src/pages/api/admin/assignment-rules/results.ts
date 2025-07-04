import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = async () => {
  const rules = await kdb
    .selectFrom('assignment_rules')
    .select('result')
    .orderBy((eb) => sql`unaccent(lower(${eb.ref('result')}))`)
    .execute();
  return rules.map((rule) => rule.result);
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
