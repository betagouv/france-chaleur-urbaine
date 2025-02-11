import { logger } from '@/server/helpers/logger';
import { processJobsIndefinitely } from '@/server/services/jobs/processor';

(async () => {
  logger.info('starting clock');
  // FIXME à réactiver une fois la PR finalisée
  // registerCrons();
  void processJobsIndefinitely();
})();
