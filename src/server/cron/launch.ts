import { syncComptesProFromUsers } from '@/server/services/airtable';
import { dailyNewManagerMail, dailyRelanceMail, weeklyOldManagerMail } from '@/server/services/manager';

export const jobs: Record<string, any> = {
  dailyNewManagerMail,
  weeklyOldManagerMail,
  dailyRelanceMail,
  syncComptesProFromUsers,
};

export const launchJob = async (job: string, ...params: any) => {
  console.info(`CRON JOB START: ${job}`);
  try {
    await jobs[job](...params);
  } catch (e) {
    console.error(`CRON JOB ERROR: ${job}`, e);
  }
};
