import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors } from '@/server/helpers/server';
import { parseResultActions } from '@/utils/expression-parser';

const GET = async () => {
  const rules = await kdb
    .selectFrom('assignment_rules')
    .select('result')
    .orderBy((eb) => sql`unaccent(lower(${eb.ref('result')}))`)
    .execute();

  return Array.from(
    new Set(
      rules
        .flatMap((rule) => {
          try {
            return parseResultActions(rule.result);
          } catch (error) {
            console.warn('Failed to parse assignment rule result:', rule.result, error);
            return [];
          }
        })
        .filter((action) => action.type === 'affecte')
        .map((action) => action.value)
    )
  ).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
};

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
