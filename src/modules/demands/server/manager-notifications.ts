import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { processInParallel } from '@/utils/async';

import { mergeLegacyValues } from './legacy-values';

/**
 * Number of concurrent email sends — matches the nodemailer pool size.
 */
const EMAIL_CONCURRENCY = 5;

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
 */
export const notifyGestionnairesOfUnhandledDemands = async () => {
  const recipients = await baseNotifiableQuery()
    .select(['u.id', 'u.email'])
    .distinct()
    .where('u.receive_old_demands', '=', true)
    .where(
      sql`(d.legacy_values->>'Notification envoyé')::date`,
      '<',
      sql`NOW() - ${sql.lit(`${businessRules.unhandledDemandReminderDays.value} days`)}::interval`
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
 * dont ils ont la permission. Marque la demande comme notifiée seulement si au moins un destinataire
 * a été trouvé — sinon on attend qu'une permission réseau soit ajoutée (idempotent, pas de boucle).
 */
export const notifyGestionnairesOfNewDemands = async () => {
  const recipients = await baseNotifiableQuery()
    .select(['u.id', 'u.email'])
    .select(sql<string[]>`array_agg(distinct d.id)`.as('demand_ids'))
    .where('u.receive_new_demands', '=', true)
    .where((eb) =>
      eb.or([eb(sql`d.legacy_values->>'Notification envoyé'`, '=', ''), eb(sql`d.legacy_values->>'Notification envoyé'`, 'is', null)])
    )
    .where((eb) =>
      eb.or([eb(sql`d.legacy_values->>'Status'`, 'is', null), eb(sql`d.legacy_values->>'Status'`, '!=', DEMANDE_STATUS.UNREALISABLE)])
    )
    .groupBy(['u.id', 'u.email'])
    .execute();

  const matchedDemandIds = [...new Set(recipients.flatMap((r) => r.demand_ids))];

  if (matchedDemandIds.length > 0) {
    await kdb
      .updateTable('demands')
      .set({
        legacy_values: mergeLegacyValues({ 'Notification envoyé': new Date().toDateString() }),
        updated_at: new Date(),
      })
      .where('id', 'in', matchedDemandIds)
      .execute();

    await Promise.all(
      matchedDemandIds.map((demandId) =>
        createEvent({
          context_id: demandId,
          context_type: 'demand',
          type: 'demand_notification_sent',
        })
      )
    );
  }

  await processInParallel(recipients, EMAIL_CONCURRENCY, async ({ id, email, demand_ids }) => {
    await sendEmailTemplate('demands.gestionnaire.nouvelles-demandes-a-traiter', { email, id }, { nbDemands: demand_ids.length });
  });

  console.info(`${recipients.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};
