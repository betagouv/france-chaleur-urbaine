import * as Sentry from '@sentry/node';

import { syncComptesProFromUsers } from '@/server/services/airtable';
import { dailyNewManagerMail, dailyRelanceMail, weeklyOldManagerMail } from '@/server/services/manager';

import '@root/sentry.node.config';

export const jobs: Record<string, any> = {
  dailyNewManagerMail,
  dailyRelanceMail,
  syncComptesProFromUsers,
  weeklyOldManagerMail,
};

export const launchJob = async (job: string, ...params: any) => {
  console.info(`CRON JOB START: ${job}`);
  try {
    await jobs[job](...params);
  } catch (e) {
    Sentry.captureException(e);
    console.error(`CRON JOB ERROR: ${job}`, e);
  }
};
