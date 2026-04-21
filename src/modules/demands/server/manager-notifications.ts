import { sendEmailTemplate } from '@/modules/email';
import { canUserAccessDemand, getAllUsersWithPermissions } from '@/modules/permissions/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { processInParallel } from '@/utils/async';

/**
 * Number of concurrent email sends — matches the nodemailer pool size.
 */
const EMAIL_CONCURRENCY = 5;

const getAllNewValidatedDemands = async () => {
  return kdb
    .selectFrom('demands')
    .select([
      'id',
      'legacy_values',
      'network_id',
      'network_type',
      'validated',
      'commune_code',
      'epci_code',
      'ept_code',
      'departement_code',
      'region_code',
    ])
    .where('validated', '=', true)
    .where('deleted_at', 'is', null)
    .where((eb) =>
      eb.or([eb(sql`legacy_values->>'Notification envoyé'`, '=', ''), eb(sql`legacy_values->>'Notification envoyé'`, 'is', null)])
    )
    .execute();
};

const getAllStaledDemandsSince = async (dateDiff: number) => {
  return kdb
    .selectFrom('demands')
    .select([
      'id',
      'legacy_values',
      'network_id',
      'network_type',
      'validated',
      'commune_code',
      'epci_code',
      'ept_code',
      'departement_code',
      'region_code',
    ])
    .where('validated', '=', true)
    .where('deleted_at', 'is', null)
    .where(sql`(legacy_values->>'Notification envoyé')::date`, '<', sql`NOW() + INTERVAL '${sql.raw(dateDiff.toString())} days'`)
    .where((eb) =>
      eb.or([
        eb(sql`legacy_values->>'Status'`, '=', ''),
        eb(sql`legacy_values->>'Status'`, 'is', null),
        eb(sql`legacy_values->>'Status'`, '=', 'En attente de prise en charge'),
      ])
    )
    .execute();
};

/**
 * Envoie un email de relance aux gestionnaires qui ont des demandes en attente de prise en charge
 * depuis plus de 7 jours.
 */
export const sendWeeklyStaleDemandsEmails = async () => {
  const [demands, allUsers] = await Promise.all([getAllStaledDemandsSince(-7), getAllUsersWithPermissions()]);

  const emailsToSend: Array<{ email: string; id: string }> = [];
  const seen = new Set<string>();

  for (const demand of demands) {
    for (const user of allUsers) {
      if (seen.has(user.email) || !user.receive_old_demands || !canUserAccessDemand(user, user.permissions, demand)) {
        continue;
      }
      emailsToSend.push({ email: user.email, id: user.id });
      seen.add(user.email);
    }
  }

  await processInParallel(emailsToSend, EMAIL_CONCURRENCY, async (recipient) => {
    await sendEmailTemplate('demands.gestionnaire-old', recipient);
  });

  console.info(`${emailsToSend.length} email(s) envoyé(s) pour les vieilles demandes.`);
};

/**
 * Envoie un email pour notifier les gestionnaires de nouvelles demandes.
 */
export const sendDailyNewDemandsEmails = async () => {
  const [demands, allUsers] = await Promise.all([getAllNewValidatedDemands(), getAllUsersWithPermissions()]);

  const emailsToSend: Array<{ email: string; id: string }> = [];
  const seen = new Set<string>();

  for (const demand of demands) {
    for (const user of allUsers) {
      if (seen.has(user.email) || !user.receive_new_demands || !canUserAccessDemand(user, user.permissions, demand)) {
        continue;
      }
      emailsToSend.push({ email: user.email, id: user.id });
      seen.add(user.email);
    }

    if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
      await kdb
        .updateTable('demands')
        .set({
          legacy_values: sql`legacy_values || ${JSON.stringify({ 'Notification envoyé': new Date().toDateString() })}::jsonb`,
          updated_at: new Date(),
        })
        .where('id', '=', demand.id)
        .execute();
    }
  }

  await processInParallel(emailsToSend, EMAIL_CONCURRENCY, async (recipient) => {
    await sendEmailTemplate('demands.gestionnaire-new', recipient, { nbDemands: 1 });
  });

  console.info(`${emailsToSend.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};
