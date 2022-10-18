import { dailyManagerMail } from 'src/services/manager';

export const jobs: Record<string, any> = {
  dailyManagerMail,
};

export const launchJob = async (job: string) => {
  console.log(`CRON JOB START: ${job}`);
  try {
    await jobs[job]();
  } catch (e) {
    console.log(`CRON JOB ERROR: ${job}`, e);
  }
};
