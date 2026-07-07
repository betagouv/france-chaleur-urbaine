import * as Sentry from '@sentry/nextjs';
import { CronJob } from 'cron';

import { purgeOldConversionEventIps } from '@/modules/conversion-tracking/server/service';
import { notifyGestionnairesOfNewDemands, notifyGestionnairesOfUnhandledDemands } from '@/modules/demands/server/manager-notifications';
import { sendRelanceToDemandeurs } from '@/modules/demands/server/relances';
import { type CronName, cronDefinitions } from '@/modules/jobs/cron.config';
import { parentLogger } from '@/server/helpers/logger';

import '@root/sentry.server.config';

import { aggregateMonthlyStats } from './aggregateMonthlyStats';

const logger = parentLogger.child({ module: 'cron' });

// Handlers bound by name to the definitions in cron.config.ts (kept separate so the metadata stays client-safe).
const cronHandlers: Record<CronName, () => Promise<unknown>> = {
  aggregateMonthlyStats,
  notifyGestionnairesOfNewDemands,
  notifyGestionnairesOfUnhandledDemands,
  purgeOldConversionEventIps: () => purgeOldConversionEventIps(),
  sendRelanceToDemandeurs,
};

export function registerCrons() {
  cronDefinitions.forEach((cron) => scheduleCron(cron));
}

function scheduleCron({ name, schedule }: (typeof cronDefinitions)[number]): CronJob {
  const handler = cronHandlers[name];
  logger.info('cron registered', { cron: name, schedule });
  return CronJob.from({
    cronTime: schedule,
    onTick: async () => {
      const startedAt = Date.now();
      logger.info('cron start', { cron: name });
      try {
        await handler();
        logger.info('cron done', { cron: name, duration_ms: Date.now() - startedAt });
      } catch (err) {
        Sentry.captureException(err, { tags: { cron: name } });
        logger.error('cron failed', { cron: name, duration_ms: Date.now() - startedAt, err });
      }
    },
    start: true,
    timeZone: 'Europe/Paris',
  });
}
