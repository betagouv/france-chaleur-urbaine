import { businessRules } from '@/modules/app/business-rules';

/**
 * Metadata of the scheduled cron jobs, without any handler import so it can be
 * used client-side (admin workflow documentation). The handlers are bound to
 * these definitions by name in src/server/cron/cron.ts.
 */
export type CronDefinition = {
  name: string;
  /** cron expression, Europe/Paris timezone */
  schedule: string;
  /** human-readable schedule, in French */
  scheduleLabel: string;
  /** French description of what the cron does, displayed in the admin documentation */
  description: string;
};

export const cronDefinitions = [
  {
    description:
      'Prévient les gestionnaires des nouvelles demandes validées affectées à un réseau de leur périmètre (option « recevoir les nouvelles demandes »). Marque les demandes comme notifiées seulement si au moins un destinataire existe.',
    name: 'notifyGestionnairesOfNewDemands',
    schedule: '00 10 * * 1-5',
    scheduleLabel: 'Lundi à vendredi, 10h00',
  },
  {
    description: `Relance les gestionnaires sur les demandes « À traiter » notifiées depuis plus de ${businessRules.unhandledDemandReminderDays.display} (option « recevoir les rappels »).`,
    name: 'notifyGestionnairesOfUnhandledDemands',
    schedule: '55 9 * * 2',
    scheduleLabel: 'Mardi, 9h55',
  },
  {
    description: `Envoie l'enquête de satisfaction aux demandeurs non recontactés par leur gestionnaire, à ${businessRules.firstRelanceDelayMonths.display} puis ${businessRules.secondRelanceDelayDays.display} après le dépôt (demandes éligibles en chauffage collectif).`,
    name: 'sendRelanceToDemandeurs',
    schedule: '05 10 * * 1',
    scheduleLabel: 'Lundi, 10h05',
  },
  {
    description: 'Agrège les statistiques du mois précédent (Matomo + Airtable + base) dans la table matomo_stats.',
    name: 'aggregateMonthlyStats',
    schedule: '15 08 1 * *',
    scheduleLabel: 'Le 1er du mois, 8h15',
  },
  {
    description: `Purge les IP et user-agents des événements de conversion de plus de ${businessRules.conversionIpRetentionDays.display} (anti-abus, rétention courte ; le domaine est conservé).`,
    name: 'purgeOldConversionEventIps',
    schedule: '30 03 * * *',
    scheduleLabel: 'Tous les jours, 3h30',
  },
] as const satisfies readonly CronDefinition[];

export type CronName = (typeof cronDefinitions)[number]['name'];
