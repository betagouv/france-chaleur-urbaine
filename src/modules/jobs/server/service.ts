import { kdb } from '@/server/db/kysely';
import { type ApiContext } from '@/server/db/kysely/base-model';

import { type JobListInput } from '../constants';

/**
 * Liste les jobs selon les critères spécifiés
 */
export const listJobs = async (input: JobListInput, _context: ApiContext) => {
  let query = kdb.selectFrom('jobs');

  // Filtres optionnels
  if (input.types && input.types.length > 0) {
    query = query.where('type', 'in', input.types);
  }

  if (input.statuses && input.statuses.length > 0) {
    query = query.where('status', 'in', input.statuses);
  }

  if (input.userId) {
    query = query.where('user_id', '=', input.userId);
  }

  const jobs = await query
    .selectAll()
    .orderBy(input.orderBy, input.orderDirection)
    .limit(input.limit)
    .offset(input.offset || 0)
    .execute();

  const total = await kdb.selectFrom('jobs').select(kdb.fn.count<string>('id').as('count')).executeTakeFirstOrThrow();

  return {
    jobs,
    pagination: {
      total: Number(total),
      offset: input.offset,
      limit: input.limit,
      hasNext: input.offset + input.limit < Number(total),
    },
  };
};
