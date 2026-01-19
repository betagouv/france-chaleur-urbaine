import type { Selectable } from 'kysely';

import { jobHandlers } from '@/modules/jobs/jobs.config';
import { type Jobs, kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { sleep } from '@/utils/time';

import { getNextJob } from './service';

const logger = parentLogger.child({
  module: 'jobs',
});

type Job = Selectable<Jobs>;

export async function processJobById(jobId: string) {
  const job = await kdb.selectFrom('jobs').selectAll().where('id', '=', jobId).executeTakeFirstOrThrow();
  await kdb.updateTable('jobs').set({ result: null, status: 'processing', updated_at: new Date() }).where('id', '=', job.id).execute();
  await processJob(job);
}

async function processJob(job: Job) {
  const startTime = Date.now();
  const jobLogger = logger.child({
    jobId: job.id,
  });
  jobLogger.info('processing job');

  try {
    const handleFunc = jobHandlers[job.type];
    if (!handleFunc) {
      throw new Error(`no processor found for the job type ${job.type}`);
    }
    const jobResult = await handleFunc(job as any, jobLogger);

    await kdb
      .updateTable('jobs')
      .set({ result: { ...jobResult, duration: Date.now() - startTime }, status: 'finished', updated_at: new Date() })
      .where('id', '=', job.id)
      .execute();
    jobLogger.info('finished job', { ...jobResult, duration: Date.now() - startTime });
  } catch (err: any) {
    jobLogger.error('error processing job', { duration: Date.now() - startTime, err: err.message, error: err });
    await kdb
      .updateTable('jobs')
      .set({ result: { duration: Date.now() - startTime, error: err.message }, status: 'error', updated_at: new Date() })
      .where('id', '=', job.id)
      .execute();
  }
}

let isShuttingDown = false;
let currentJobId: string | undefined;

export async function processJobsIndefinitely() {
  while (!isShuttingDown) {
    try {
      const job = await getNextJob();

      if (!job) {
        logger.debug('no jobs, sleeping');
        await sleep(5000);
        continue;
      }

      currentJobId = job.id;
      await processJob(job);
    } catch (err: any) {
      // do not stop the worker
      logger.error('unknown job error', { err: err.message });
      await sleep(500); // small delay to avoid infinite error loops
    } finally {
      currentJobId = undefined;
    }
  }
}

export async function shutdownProcessor() {
  isShuttingDown = true;
  if (!currentJobId) {
    return;
  }
  // Reset current job to pending if there is one
  await kdb
    .updateTable('jobs')
    .set({
      result: null,
      status: 'pending',
      updated_at: new Date(),
    })
    .where('id', '=', currentJobId)
    .execute();
}
