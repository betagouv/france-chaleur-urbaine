import { registerCrons } from '@/server/cron/cron';
import { logger } from '@/server/helpers/logger';
import { processJobsIndefinitely } from '@/server/services/jobs/processor';

(async () => {
  logger.info('starting clock');
  registerCrons();
  void processJobsIndefinitely();
})();
