import * as Sentry from '@sentry/nextjs';

import { sendDailyNewDemandsEmails, sendWeeklyStaleDemandsEmails } from '@/modules/demands/server/manager-notifications';
import { sendDailyRelanceEmails } from '@/modules/demands/server/relances';
import { syncComptesProFromUsers } from '@/server/services/airtable';

import '@root/sentry.server.config';

export const jobs: Record<string, any> = {
  sendDailyNewDemandsEmails,
  sendDailyRelanceEmails,
  sendWeeklyStaleDemandsEmails,
  syncComptesProFromUsers,
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
