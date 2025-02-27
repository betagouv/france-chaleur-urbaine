import { env } from '@/environment';
import { registerCrons } from '@/server/cron/cron';
import { shutdownKyselyDatabase } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { processJobsIndefinitely, shutdownProcessor } from '@/server/services/jobs/processor';

let isShuttingDown = false;

// Register shutdown handlers
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    try {
      if (isShuttingDown) {
        logger.warn('clock shut down (forced)');
        process.exit(0);
      }
      isShuttingDown = true;
      logger.warn(`received signal ${signal}. shutting down clock`);
      await shutdownProcessor();
      await shutdownKyselyDatabase();
      logger.warn('clock shut down complete');
      process.exit(0);
    } catch (err: any) {
      logger.error('error during shutdown', { err: err.message });
      process.exit(2);
    }
  });
});

(async () => {
  logger.warn('starting clock');
  if (env.CLOCK_CRONS_ENABLE) {
    registerCrons();
  }
  if (env.CLOCK_JOBS_PROCESSOR_ENABLE) {
    void processJobsIndefinitely();
  }
})();
