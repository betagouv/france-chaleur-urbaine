import { TRPCError } from '@trpc/server';

import { clientConfig } from '@/client-config';
import type { Context } from '@/modules/config/server/context-builder';
import type { UpdateGestionnaireDemandInput } from '@/modules/demands/constants';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { buildDemandAccessFilter } from '@/modules/permissions/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

import { computeNetworkDistance } from './eligibility';
import {
  anonymizeEmail,
  anonymizeName,
  anonymizePhone,
  buildDemandQuery,
  enrichDemandForGestionnaire,
  getDemandById,
  resolveNetworkInfo,
} from './helpers';

const logger = parentLogger.child({ module: 'demands/gestionnaire-operations' });

/**
 * Liste les demandes accessibles par un gestionnaire/collectivité/ALEC selon ses permissions.
 * Anonymise les PII (email, nom, téléphone) si `ctx.anonymize` est vrai.
 */
export const listDemands = async (ctx: Context) => {
  const startTime = Date.now();
  const permissions = await ctx.getPermissions();

  if (permissions.length === 0 && ctx.user.role !== 'admin') {
    return [];
  }

  const accessFilter = buildDemandAccessFilter(ctx.user, permissions);

  const records = await accessFilter(buildDemandQuery()).execute();

  logger.info('kdb.getDemands', {
    duration: Date.now() - startTime,
    permissionsCount: permissions.length,
    recordsCount: records.length,
  });
  const demands = records.map(({ testAddress, ...demand }) => enrichDemandForGestionnaire({ demand, testAddress }));

  if (ctx.anonymize) {
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
 */
export const updateDemandByGestionnaire = async (demandId: string, values: UpdateGestionnaireDemandInput, userId: string) => {
  const { comment_gestionnaire, ...legacyUpdates } = values;

  const currentDemand = await kdb.selectFrom('demands').selectAll().where('id', '=', demandId).executeTakeFirst();
  if (!currentDemand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

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
 * Gestionnaire/collectivité/ALEC : demande une réaffectation (changement ou retrait du réseau affecté).
 * - `networkIdFcu`/`networkType` à `null` = demande de désaffectation
 * - Refuse si la demande n'existe pas / est supprimée
 * - Refuse si une demande de réaffectation est déjà en attente
 * - Refuse si la cible (réseau ou null) est identique à l'affectation actuelle
 * - Protection TOCTOU via UPDATE conditionnel `pending_assignment_change IS NULL`
 * Un snapshot de la distance au réseau ciblé est stocké dans le JSONB (null en cas de désaffectation).
 */
export const requestDemandAssignmentChange = async (
  demandId: string,
  networkIdFcu: number | null,
  networkType: NetworkType | null,
  comment: string | null,
  userId: string
) => {
  const demand = await kdb
    .selectFrom('demands')
    .select(['id', 'network_id', 'network_type', 'pending_assignment_change'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  if (!demand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }
  if (demand.pending_assignment_change) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Une demande de réaffectation est déjà en attente' });
  }
  if (demand.network_id === networkIdFcu && demand.network_type === networkType) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: networkIdFcu === null ? 'La demande est déjà sans réseau affecté' : 'Le réseau demandé est déjà affecté à cette demande',
    });
  }

  const isUnassignment = networkIdFcu === null || networkType === null;

  const newInfo = isUnassignment ? { network_name: null, network_sncu_id: null } : await resolveNetworkInfo(networkType, networkIdFcu);
  if (!isUnassignment && !newInfo.network_name) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau cible introuvable' });
  }
  const newDistance = isUnassignment ? null : await computeNetworkDistance(demandId, networkIdFcu, networkType);

  const oldInfo =
    demand.network_type !== null && demand.network_id !== null
      ? await resolveNetworkInfo(demand.network_type, demand.network_id)
      : { network_name: null, network_sncu_id: null };
  let oldDistance: number | null = null;
  if (demand.network_id !== null && demand.network_type !== null) {
    try {
      oldDistance = await computeNetworkDistance(demandId, demand.network_id, demand.network_type);
    } catch {
      oldDistance = null;
    }
  }

  const pendingPayload = {
    author_id: userId,
    comment,
    distance: newDistance,
    network_id: networkIdFcu,
    network_type: networkType,
    requested_at: new Date().toISOString(),
  };

  const result = await kdb
    .updateTable('demands')
    .set({ pending_assignment_change: sql`${JSON.stringify(pendingPayload)}::jsonb`, updated_at: new Date() })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .where('pending_assignment_change', 'is', null)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Une demande de réaffectation est déjà en attente' });
  }

  await createUserEvent({
    author_id: userId,
    context_id: demandId,
    context_type: 'demand',
    data: {
      comment,
      new: {
        distance: newDistance,
        network_id: networkIdFcu,
        network_name: newInfo.network_name,
        network_sncu_id: newInfo.network_sncu_id,
        network_type: networkType,
      },
      old: {
        distance: oldDistance,
        network_id: demand.network_id,
        network_name: oldInfo.network_name,
        network_sncu_id: oldInfo.network_sncu_id,
        network_type: demand.network_type,
      },
    },
    type: 'demand_assignment_change_requested',
  });

  const requester = await kdb.selectFrom('users').select('email').where('id', '=', userId).executeTakeFirst();
  await sendEmailTemplate(
    'demands.admin-assignment-change-request',
    { email: clientConfig.destinationEmails.pro },
    {
      comment,
      demandId,
      requestedSncuId: isUnassignment ? 'désaffectation' : (newInfo.network_sncu_id ?? String(networkIdFcu)),
      requesterEmail: requester?.email ?? userId,
    }
  ).catch((error: unknown) => {
    logger.error('Failed to send assignment change request email:', error);
  });
};

/**
 * Gestionnaire/collectivité/ALEC : annule sa propre demande de réaffectation en attente.
 * Seul l'auteur peut annuler. Trace un event avec le snapshot du pending.
 */
export const cancelDemandAssignmentChangeRequest = async (demandId: string, userId: string) => {
  const demand = await kdb
    .selectFrom('demands')
    .select(['id', 'pending_assignment_change'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  if (!demand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

  const pending = demand.pending_assignment_change;
  if (!pending) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aucune demande de réaffectation en attente' });
  }
  if (pending.author_id !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: "Seul l'auteur peut annuler sa demande de réaffectation" });
  }

  await kdb.updateTable('demands').set({ pending_assignment_change: null, updated_at: new Date() }).where('id', '=', demandId).execute();

  const info =
    pending.network_type !== null && pending.network_id !== null
      ? await resolveNetworkInfo(pending.network_type, pending.network_id)
      : { network_name: null, network_sncu_id: null };

  await createUserEvent({
    author_id: userId,
    context_id: demandId,
    context_type: 'demand',
    data: {
      comment: pending.comment,
      pending: {
        distance: pending.distance,
        network_id: pending.network_id,
        network_name: info.network_name,
        network_sncu_id: info.network_sncu_id,
        network_type: pending.network_type,
      },
    },
    type: 'demand_assignment_change_request_cancelled',
  });
};
