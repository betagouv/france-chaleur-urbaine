import { TRPCError } from '@trpc/server';
import type { User } from 'next-auth';

import { clientConfig } from '@/client-config';
import type { UpdateGestionnaireDemandInput } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { buildDemandAccessFilter, getUserPermissions } from '@/modules/permissions/server/service';
import type { Permission } from '@/modules/permissions/types';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { anonymizeEmail, anonymizeName, anonymizePhone, buildDemandQuery, enrichDemandForGestionnaire, getDemandById } from './helpers';

const logger = parentLogger.child({ module: 'demands/gestionnaire-operations' });

type ListOptions = {
  anonymize?: boolean;
  permissions?: Permission[];
};

/**
 * Liste les demandes accessibles par un gestionnaire/collectivité/ALEC selon ses permissions.
 * Anonymise les PII (email, nom, téléphone) si `options.anonymize` est vrai.
 */
export const listDemands = async (user: User, options?: ListOptions) => {
  if (!user) {
    return [];
  }

  const startTime = Date.now();
  const permissions = options?.permissions ?? (await getUserPermissions(user.id));

  if (permissions.length === 0 && user.role !== 'admin') {
    return [];
  }

  const accessFilter = buildDemandAccessFilter(user, permissions);

  const records = await accessFilter(buildDemandQuery()).orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute();

  logger.info('kdb.getDemands', {
    duration: Date.now() - startTime,
    permissionsCount: permissions.length,
    recordsCount: records.length,
  });
  const demands = records.map(({ testAddress, ...demand }) => enrichDemandForGestionnaire({ demand, testAddress }));

  if (options?.anonymize) {
    return demands.map((demand) => ({
      ...demand,
      Mail: anonymizeEmail(demand.Mail),
      Nom: anonymizeName(demand.Nom),
      Prénom: anonymizeName(demand.Prénom),
      Téléphone: demand.Téléphone ? anonymizePhone() : undefined,
    }));
  }

  return demands;
};

/**
 * Gestionnaire: updates a demand from fields in `zGestionnaireDemandUpdateValues`.
 * Only `legacy_values` + `comment_gestionnaire` are affected (no column sync for network/validated).
 * Sends an email when `Gestionnaire Affecté à` changes.
 */
export const updateDemandByGestionnaire = async (demandId: string, values: UpdateGestionnaireDemandInput, userId: string) => {
  const { comment_gestionnaire, ...legacyUpdates } = values;

  const currentDemand = await kdb.selectFrom('demands').selectAll().where('id', '=', demandId).executeTakeFirst();
  if (!currentDemand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

  const oldAssignment = currentDemand.legacy_values['Gestionnaire Affecté à'];
  const newAssignment = legacyUpdates['Gestionnaire Affecté à'];

  const [updatedDemand] = await kdb
    .updateTable('demands')
    .set({
      ...(comment_gestionnaire && { comment_gestionnaire }),
      legacy_values: sql`legacy_values || ${JSON.stringify(legacyUpdates)}::jsonb`,
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returningAll()
    .execute();

  if (newAssignment && oldAssignment !== newAssignment) {
    // Automation import from https://airtable.com/app9opX8gRAtBqkan/wfloOFXhfUKvhL2Qc
    await sendEmailTemplate(
      'demands.admin-assignment-change',
      { email: clientConfig.destinationEmails.pro },
      { demand: updatedDemand.legacy_values, newAssignment }
    ).catch((error: unknown) => {
      logger.error('Failed to send assignment change email:', error);
    });
  }

  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', updatedDemand.id)
    .executeTakeFirst();

  await createUserEvent({
    author_id: userId,
    context_id: demandId,
    context_type: 'demand',
    data: values,
    type: 'demand_updated',
  });

  const demand = await getDemandById(updatedDemand.id);
  if (!demand) {
    throw new Error('Demand not found');
  }
  return enrichDemandForGestionnaire({ demand, testAddress: testAddress || null });
};

/**
 * Collectivité/ALEC: requests a network change on a demand.
 * Creates an event for admin review. The demand stays visible to the current gestionnaire.
 */
export const requestDemandNetworkChange = async (demandId: string, requestedSncuId: string, reason: string, userId: string) => {
  const demand = await kdb
    .selectFrom('demands')
    .select(['id', 'network_id'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  if (!demand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

  await createUserEvent({
    author_id: userId,
    context_id: demandId,
    context_type: 'demand',
    data: { current_network_id: demand.network_id, reason, requested_sncu_id: requestedSncuId },
    type: 'demand_network_change_requested',
  });

  const requester = await kdb.selectFrom('users').select('email').where('id', '=', userId).executeTakeFirst();
  await sendEmailTemplate(
    'demands.admin-network-change-request',
    { email: clientConfig.destinationEmails.pro },
    { demandId, reason, requestedSncuId, requesterEmail: requester?.email ?? userId }
  ).catch((error: unknown) => {
    logger.error('Failed to send network change request email:', error);
  });
};
