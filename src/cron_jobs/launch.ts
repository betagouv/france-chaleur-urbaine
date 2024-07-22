import * as Sentry from '@sentry/node';

import { dailyNewManagerMail, dailyRelanceMail, weeklyOldManagerMail } from 'src/services/manager';
import { updateUsers } from 'src/services/users';
import '../../sentry.node.config';

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
