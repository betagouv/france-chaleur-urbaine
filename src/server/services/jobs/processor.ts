import { type Selectable } from 'kysely';

import { type Jobs, kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { processProEligibilityTestJob } from '@/server/services/jobs/pro_eligibility_test_jobs';
import { sleep } from '@/utils/time';

const logger = parentLogger.child({
  module: 'jobs',
});

type Job = Selectable<Jobs>;

const jobToHandleFunc = {
  pro_eligibility_test: processProEligibilityTestJob,
} as const;

export async function processJobById(jobId: string) {
  const job = await kdb.selectFrom('jobs').selectAll().where('id', '=', jobId).executeTakeFirstOrThrow();
  await kdb.updateTable('jobs').set({ status: 'processing', updated_at: new Date(), result: null }).where('id', '=', job.id).execute();
  await processJob(job);
}

async function processJob(job: Job) {
  const startTime = Date.now();
  const jobLogger = logger.child({
    jobId: job.id,
  });
  jobLogger.info('processing job');

  try {
    const handleFunc = jobToHandleFunc[job.type];
    if (!handleFunc) {
      throw new Error(`no processor found for the job type ${job.type}`);
    }
    const jobResult = await handleFunc(job as any, jobLogger);

    await kdb
      .updateTable('jobs')
      .set({ status: 'finished', updated_at: new Date(), result: { ...jobResult, duration: Date.now() - startTime } })
      .where('id', '=', job.id)
      .execute();
    jobLogger.info('finished job', { ...jobResult, duration: Date.now() - startTime });
  } catch (err: any) {
    jobLogger.error('error processing job', { err: err.message, duration: Date.now() - startTime });
    await kdb
      .updateTable('jobs')
      .set({ status: 'error', result: { error: err.message, duration: Date.now() - startTime }, updated_at: new Date() })
      .where('id', '=', job.id)
      .execute();
  }
}

export async function processJobsIndefinitely() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const job = await getNextJob();

      if (!job) {
        logger.debug('no jobs, sleeping');
        await sleep(5000);
        continue;
      }

      await processJob(job);
    } catch (err: any) {
      // do not stop the worker
      logger.error('unknown job error', { err: err.message });
    }
  }
}

/**
 * Récupère le prochain job en attente et le passe en statut "processing". Renvoi null si aucun job n'est à traiter.
 *
 * Cette fonction sélectionne un job avec le statut `"pending"` en utilisant `FOR UPDATE SKIP LOCKED`
 * pour éviter que plusieurs instances du worker ne traitent le même job simultanément.
 * Une fois sélectionné, le job est immédiatement mis à jour en `"processing"`, ce qui le verrouille
 * pour les autres workers.
 */
async function getNextJob() {
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
