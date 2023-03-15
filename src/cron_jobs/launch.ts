import { dailyManagerMail, dailyRelanceMail } from 'src/services/manager';
import { updateUsers } from 'src/services/users';

export const jobs: Record<string, any> = {
  dailyManagerMail,
  dailyRelanceMail,
  updateUsers,
};

export const launchJob = async (job: string) => {
  console.log(`CRON JOB START: ${job}`);
  try {
    await jobs[job]();
  } catch (e) {
    console.log(`CRON JOB ERROR: ${job}`, e);
  }
};
