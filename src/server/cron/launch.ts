import * as Sentry from '@sentry/node';

import { syncComptesProFromUsers, syncGestionnairesWithUsers, syncLastConnectionFromUsers } from '@/server/services/airtable';
import { dailyNewManagerMail, dailyRelanceMail, weeklyOldManagerMail } from '@/server/services/manager';

import '@root/sentry.node.config';

export const jobs: Record<string, any> = {
  dailyNewManagerMail,
  weeklyOldManagerMail,
  dailyRelanceMail,
  syncGestionnairesWithUsers,
  syncLastConnectionFromUsers,
  syncComptesProFromUsers,
};

export const launchJob = async (job: string, ...params: any) => {
  console.log(`CRON JOB START: ${job}`);
  try {
    await jobs[job](...params);
  } catch (e) {
    Sentry.captureException(e);
    console.log(`CRON JOB ERROR: ${job}`, e);
  }
};
