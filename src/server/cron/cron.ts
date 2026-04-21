import * as Sentry from '@sentry/nextjs';
import { CronJob } from 'cron';

import { notifyGestionnairesOfNewDemands, notifyGestionnairesOfUnhandledDemands } from '@/modules/demands/server/manager-notifications';
import { sendRelanceToDemandeurs } from '@/modules/demands/server/relances';
import { parentLogger } from '@/server/helpers/logger';

import '@root/sentry.server.config';

import { aggregateMonthlyStats } from './aggregateMonthlyStats';

const logger = parentLogger.child({ module: 'cron' });

type CronDefinition = {
  name: string;
  schedule: string;
  handler: () => Promise<unknown>;
};

const crons: CronDefinition[] = [
  {
    // Prévient les gestionnaires des nouvelles demandes validées qui leur sont accessibles.
    handler: notifyGestionnairesOfNewDemands,
    name: 'notifyGestionnairesOfNewDemands',
    schedule: '00 10 * * 1-5', // lun-ven 10:00 Paris
  },
  {
    // Relance les gestionnaires sur les demandes "En attente de prise en charge" depuis plus de 7 jours.
    handler: notifyGestionnairesOfUnhandledDemands,
    name: 'notifyGestionnairesOfUnhandledDemands',
    schedule: '55 9 * * 2', // mardi 09:55 Paris
  },
  {
    // Envoie les relances aux demandeurs non recontactés par leur gestionnaire (J+30 puis J+45).
    handler: sendRelanceToDemandeurs,
    name: 'sendRelanceToDemandeurs',
    schedule: '05 10 * * 1', // lundi 10:05 Paris
  },
  {
    // Agrège les stats du mois précédent (Matomo + Airtable + DB) dans la table matomo_stats.
    handler: aggregateMonthlyStats,
    name: 'aggregateMonthlyStats',
    schedule: '15 08 1 * *', // 1er du mois 08:15 Paris
  },
];

export function registerCrons() {
  crons.forEach((cron) => scheduleCron(cron));
}

function scheduleCron({ name, schedule, handler }: CronDefinition): CronJob {
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
