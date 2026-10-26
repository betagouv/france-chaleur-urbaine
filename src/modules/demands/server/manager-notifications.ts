import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import type { NewDemandsNotificationFrequency } from '@/modules/users/constants';
import { kdb, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { processInParallel } from '@/utils/async';
import { dayjs } from '@/utils/date';

import { mergeLegacyValues } from './legacy-values';

/**
 * Number of concurrent email sends — matches the nodemailer pool size.
 */
const EMAIL_CONCURRENCY = 5;

/** Day of the week (0 = Sunday) of the weekly digest, matching the cron (Monday 10h). */
const WEEKLY_DIGEST_DAY = 1;

const newDemandsFrequency = sql<NewDemandsNotificationFrequency>`u.preferences->'notifications'->>'new_demands'`;
const pendingDemandsReminder = sql<boolean>`(u.preferences->'notifications'->>'pending_demands_reminder')::boolean`;

/** Date (day precision) at which the demand was marked as notified, null while not notified. */
const notifiedDate = sql<Date | null>`nullif(d.legacy_values->>'Notification envoyé', '')::date`;
const notNotified = sql<boolean>`${notifiedDate} is null`;

/**
 * Base : jointure (user, permission, demande) avec les filtres communs aux notifications.
 * On match strictement sur la permission réseau (`up.type` = `d.network_type`, `up.resource_id` = `d.network_id`).
 * Les demandes sans réseau, supprimées ou non validées sont écartées.
 */
const baseNotifiableQuery = () =>
  kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .innerJoin('demands as d', (join) => join.onRef('up.type', '=', 'd.network_type').on(sql<boolean>`up.resource_id = d.network_id::text`))
    .where('u.active', '=', true)
    .where('d.validated', '=', true)
    .where('d.deleted_at', 'is', null)
    .where('d.network_id', 'is not', null)
    .where('d.network_type', 'is not', null);

/**
 * Envoie un email de relance aux gestionnaires qui ont des demandes à traiter
 * depuis plus de 7 jours sur un réseau pour lequel ils ont une permission.
 *
 * La durée est comptée depuis la réception réelle : le jour du marquage pour un compte notifié
 * quotidiennement, le lundi du récapitulatif suivant le marquage pour un compte hebdomadaire.
 */
export const notifyGestionnairesOfUnhandledDemands = async () => {
  const now = new Date();
  // first Monday on or after the marking date: + ((8 - dow) % 7) days, dow 0 = Sunday, 1 = Monday
  const receivedDate = sql<Date>`case when ${newDemandsFrequency} = 'weekly' then ${notifiedDate} + ((8 - extract(dow from ${notifiedDate})::int) % 7) else ${notifiedDate} end`;

  const recipients = await baseNotifiableQuery()
    .select(['u.id', 'u.email'])
    .distinct()
    .where(pendingDemandsReminder, '=', true)
    .where(
      receivedDate,
      '<',
      sql<Date>`${now.toISOString()}::timestamptz - ${sql.lit(`${businessRules.unhandledDemandReminderDays.value} days`)}::interval`
    )
    .where((eb) =>
      eb.or([
        eb(sql`d.legacy_values->>'Status'`, '=', ''),
        eb(sql`d.legacy_values->>'Status'`, 'is', null),
        eb(sql`d.legacy_values->>'Status'`, '=', DEMANDE_STATUS.TO_PROCESS),
      ])
    )
    .execute();

  await processInParallel(recipients, EMAIL_CONCURRENCY, async ({ id, email }) => {
    await sendEmailTemplate('demands.gestionnaire.rappel-demandes-en-attente', { email, id });
  });

  console.info(`${recipients.length} email(s) envoyé(s) pour les vieilles demandes.`);
};

/**
 * Envoie un email aux gestionnaires pour les nouvelles demandes validées affectées à un réseau
 * dont ils ont la permission, selon leur préférence :
 * - quotidien : chaque exécution, les demandes pas encore notifiées ;
 * - hebdomadaire : le lundi seulement, les demandes pas encore notifiées ou notifiées (à un collègue
 *   quotidien) au cours des 7 derniers jours — chaque demande tombe ainsi dans un seul récapitulatif.
 * Marque la demande comme notifiée seulement si au moins un destinataire a été trouvé — sinon on attend
 * qu'une permission réseau soit ajoutée (idempotent, pas de boucle).
 */
export const notifyGestionnairesOfNewDemands = async () => {
  const now = new Date();
  const today = dayjs(now).tz('Europe/Paris');
  const isWeeklyDigestDay = today.day() === WEEKLY_DIGEST_DAY;
  // demands marked strictly after this date were not part of the previous digest
  const previousDigestDate = today.subtract(7, 'day').format('YYYY-MM-DD');

  const recipients = await baseNotifiableQuery()
    .select(['u.id', 'u.email'])
    .select(newDemandsFrequency.as('frequency'))
    .select(sql<string[]>`array_agg(distinct d.id)`.as('demand_ids'))
    .select(sql<string[]>`coalesce(array_agg(distinct d.id) filter (where ${notNotified}), '{}')`.as('unnotified_demand_ids'))
    .where((eb) =>
      eb.or([
        eb.and([eb(newDemandsFrequency, '=', 'daily'), eb(notNotified, '=', true)]),
        ...(isWeeklyDigestDay
          ? [
              eb.and([
                eb(newDemandsFrequency, '=', 'weekly'),
                eb.or([eb(notNotified, '=', true), eb(notifiedDate, '>', sql<Date>`${previousDigestDate}::date`)]),
              ]),
            ]
          : []),
      ])
    )
    .where((eb) =>
      eb.or([eb(sql`d.legacy_values->>'Status'`, 'is', null), eb(sql`d.legacy_values->>'Status'`, '!=', DEMANDE_STATUS.UNREALISABLE)])
    )
    .groupBy(['u.id', 'u.email', newDemandsFrequency])
    .execute();

  const newlyNotifiedDemandIds = [...new Set(recipients.flatMap((r) => r.unnotified_demand_ids))];

  if (newlyNotifiedDemandIds.length > 0) {
    await kdb
      .updateTable('demands')
      .set({
        legacy_values: mergeLegacyValues({ 'Notification envoyé': now.toDateString() }),
        updated_at: now,
      })
      .where('id', 'in', newlyNotifiedDemandIds)
      .execute();

    await Promise.all(
      newlyNotifiedDemandIds.map((demandId) =>
        createEvent({
          context_id: demandId,
          context_type: 'demand',
          type: 'demand_notification_sent',
        })
      )
    );
  }

  await processInParallel(recipients, EMAIL_CONCURRENCY, async ({ id, email, frequency, demand_ids }) => {
    await sendEmailTemplate(
      frequency === 'weekly'
        ? 'demands.gestionnaire.nouvelles-demandes-a-traiter-weekly'
        : 'demands.gestionnaire.nouvelles-demandes-a-traiter-daily',
      { email, id },
      { frequency: frequency === 'weekly' ? 'weekly' : 'daily', nbDemands: demand_ids.length }
    );
  });

  console.info(`${recipients.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};
