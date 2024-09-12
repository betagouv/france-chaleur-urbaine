import { saveStatsInDB } from 'src/cron_jobs/saveStatsInDB';

if (process.argv.length !== 4) {
  console.info('Usage: yarn tsx scripts/statistics/updateMonthlyStats.ts startDate(format : YYYY-MM-DD) endDate(format : YYYY-MM-DD)');
  process.exit(1);
}

const startDate = process.argv[2]; //Format YYYY-MM-DD
const endDate = process.argv[3]; //Format YYYY-MM-DD

saveStatsInDB(startDate, endDate);
