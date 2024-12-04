import * as Sentry from '@sentry/node';

import { dailyNewManagerMail, dailyRelanceMail, weeklyOldManagerMail } from '@/server/services/manager';
import { updateUsers } from '@/services/users';

import '@root/sentry.node.config';

export const jobs: Record<string, any> = {
  dailyNewManagerMail,
  weeklyOldManagerMail,
  dailyRelanceMail,
  updateUsers,
};

export const launchJob = async (job: string) => {
  console.log(`CRON JOB START: ${job}`);
  try {
    await jobs[job]();
  } catch (e) {
    Sentry.captureException(e);
    console.log(`CRON JOB ERROR: ${job}`, e);
  }
};
