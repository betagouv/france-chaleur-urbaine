import { sql } from 'kysely';

import * as demandsService from '@/modules/demands/server/demands-service';
import { sendEmailTemplate } from '@/modules/email';
import { canUserAccessDemand, getAllUsersWithPermissions } from '@/modules/permissions/server/service';
import { kdb } from '@/server/db/kysely';
import type { Demand } from '@/types/Summary/Demand';
import { processInParallel } from '@/utils/async';

/**
 * Number of concurrent email sends — matches the nodemailer pool size.
 */
const EMAIL_CONCURRENCY = 5;

/**
 * External API: returns demands matching tags from api_accounts.gestionnaires.
 * Used only by /api/v1/demands/[key] for API consumers.
 */
export const getGestionnairesDemands = async (gestionnaires: string[]): Promise<Demand[]> => {
  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where('validated', '=', true)
      .where('deleted_at', 'is', null)
      .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
      .execute()
  ).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));

  return records
    .map((record) => ({ id: record.id, ...(record.fields as Record<string, unknown>) }) as Demand)
    .filter((record) => record.Gestionnaires?.some((gestionnaire) => gestionnaires.includes(gestionnaire)));
};

export const getAllDemands = async () => {
  const records = (await kdb.selectFrom('demands').selectAll().orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute()).map(
    ({ id, legacy_values }) => ({
      fields: legacy_values,
      id,
    })
  );
  return records.map((record) => ({ id: record.id, ...record.fields }));
};

export const getAllNewDemands = async () => {
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

export const getAllStaledDemandsSince = async (dateDiff: number) => {
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
export const weeklyOldManagerMail = async () => {
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
export const dailyNewManagerMail = async () => {
  const [demands, allUsers] = await Promise.all([getAllNewDemands(), getAllUsersWithPermissions()]);

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

    // Mark demand as notified
    if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
      await demandsService.update(demand.id, {
        'Notification envoyé': new Date().toDateString(),
      });
    }
  }

  await processInParallel(emailsToSend, EMAIL_CONCURRENCY, async (recipient) => {
    await sendEmailTemplate('demands.gestionnaire-new', recipient, { nbDemands: 1 });
  });

  console.info(`${emailsToSend.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};
