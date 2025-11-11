import { captureException } from '@sentry/nextjs';
import { dailyRelanceMail as demandsDailyRelanceMail } from '@/modules/demands/server/demands-service';
import { syncComptesProFromUsers } from '@/server/services/airtable';
import { dailyNewManagerMail, weeklyOldManagerMail } from '@/server/services/manager';

import '@root/sentry.server.config';

export const jobs: Record<string, any> = {
  dailyNewManagerMail,
  demandsDailyRelanceMail,
  syncComptesProFromUsers,
  weeklyOldManagerMail,
};

export const launchJob = async (job: string, ...params: any) => {
  console.info(`CRON JOB START: ${job}`);
  try {
    await jobs[job](...params);
  } catch (e) {
    captureException(e);
    console.error(`CRON JOB ERROR: ${job}`, e);
  }
};
