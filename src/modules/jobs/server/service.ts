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

/**
 * Récupère le prochain job en attente et le passe en statut "processing". Renvoi null si aucun job n'est à traiter.
 *
 * Cette fonction sélectionne un job avec le statut `"pending"` en utilisant `FOR UPDATE SKIP LOCKED`
 * pour éviter que plusieurs instances du worker ne traitent le même job simultanément.
 * Une fois sélectionné, le job est immédiatement mis à jour en `"processing"`, ce qui le verrouille
 * pour les autres workers.
 */
export async function getNextJob() {
  return await kdb.transaction().execute(async (trx) => {
    const job = await trx
      .selectFrom('jobs')
      .selectAll()
      .where('status', '=', 'pending')
      .orderBy('created_at')
      .forUpdate()
      .skipLocked()
      .limit(1)
      .executeTakeFirst();

    if (!job) {
      return null;
    }

    await trx.updateTable('jobs').set({ status: 'processing', updated_at: new Date(), result: null }).where('id', '=', job.id).execute();
    return job;
  });
}
