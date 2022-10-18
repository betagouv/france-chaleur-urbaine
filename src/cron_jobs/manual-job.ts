import { jobs } from './launch';

const runJob = async (job: string): Promise<void> => {
  try {
    await jobs[job]();
  } catch (e) {
    console.log(`Manual cron job error: ${job}`, e);
  }

  console.log(`Manual cron job ${job} done`);
  process.exit(0);
};

if (process.argv.length < 3) {
  console.log('Please verify your command. Expected format:');
  console.log(
    'export NODE_PATH=./ && ts-node src/cron_jobs/manual-job.ts job_name'
  );
  process.exit(1);
}

const jobName = process.argv[2];
const job = jobs[jobName];
if (job) {
  runJob(jobName);
} else {
  console.log(`The job ${process.argv[2]} does not exist !`);
  process.exit(2);
}
