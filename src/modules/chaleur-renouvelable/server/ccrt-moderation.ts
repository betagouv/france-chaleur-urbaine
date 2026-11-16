import { TRPCError } from '@trpc/server';
import type { Transaction } from 'kysely';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { cancelTransferredDemand } from '@/modules/demands/server/cancel-transfer';
import { createTransferredDemand } from '@/modules/demands/server/creation-transfer';
import type { EventDataMap } from '@/modules/events/constants';
import { createUserEvent } from '@/modules/events/server/service';
import { type DB, kdb, sql } from '@/server/db/kysely';

import type { zCcrtAdminComment, zCcrtArchiveDemand, zCcrtDemandId, zCcrtModerationEmailData, zCcrtTransferDemand } from '../constants';
import { selectDemandesChaleurRenouvelableForList } from './ccrt-demand-query';
import { getCcrtTransferNetwork } from './ccrt-transfer-network';
import { getDemandHeatingEnergy, getDemandHeatingType, getDemandStructure } from './demand-mapping';

/**
 * Archives only unpublished demands; email delivery is queued in the same transaction.
 */
export const archiveCcrtDemand = async (ctx: Context, input: z.infer<typeof zCcrtArchiveDemand>) =>
  kdb.transaction().execute(async (transaction) => {
    await lockPendingDemand(transaction, input.demandId);
    const archivedAt = new Date();
    await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({
        archive_comment: input.reason === 'other' ? input.comment || null : null,
        archive_reason: input.reason,
        archived_at: archivedAt,
        updated_at: archivedAt,
      })
      .where('id', '=', input.demandId)
      .execute();
    if (input.sendEmail) {
      await queueModerationEmail(transaction, ctx, input.demandId, archivedAt);
    }
    await recordModeration(transaction, ctx, input.demandId, { action: 'archive', reason: input.reason });
    return { id: input.demandId };
  });

/**
 * Atomically creates the classic demand and archives its accompaniment source.
 */
export const transferCcrtDemand = async (ctx: Context, input: z.infer<typeof zCcrtTransferDemand>) => {
  const context = await getCcrtTransferNetwork(ctx, input);
  const network = context.network;
  if (!network) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Réseau de chaleur introuvable' });
  }
  return kdb.transaction().execute(async (transaction) => {
    const demand = await lockPendingDemand(transaction, input.demandId);
    if (demand.updated_at.toISOString() !== context.updatedAt) {
      throw new TRPCError({ code: 'CONFLICT', message: 'La demande a été modifiée. Rechargez-la avant de la transférer.' });
    }
    const structure = getDemandStructure({ demandConcern: demand.demand_concern, occupantStatus: demand.occupant_status });
    const transferred = await createTransferredDemand(transaction, {
      adminUserId: ctx.user.id,
      network,
      territory: demand,
      values: {
        ...structure,
        acquisition: demand.acquisition,
        address: demand.address,
        city: context.address.city,
        commentUser: [demand.comments, input.managerMessage && `Message de l’équipe FCU au gestionnaire :\n${input.managerMessage}`]
          .filter(Boolean)
          .join('\n\n'),
        company: demand.organization_name ?? '',
        coords: context.coordinates,
        demandArea: demand.surface_area ?? demand.average_area * demand.housing_count,
        demandCompanyName: demand.organization_name ?? '',
        department: demand.departement_code ?? '',
        eligibility: { distance: network.distance, inPDP: false, isEligible: true },
        email: demand.email,
        firstName: demand.first_name,
        heatingEnergy: getDemandHeatingEnergy(demand.heating_energy),
        heatingType: getDemandHeatingType(demand.housing_type),
        lastName: demand.last_name,
        nbLogements: demand.housing_count,
        phone: demand.phone,
        postcode: context.address.postcode,
        region: demand.region_code ?? '',
        termOfUse: true,
      },
    });
    const archivedAt = new Date();
    const networkName = network.nom_reseau ?? network.sncu_id ?? `Réseau ${network.id_fcu}`;
    await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({
        archived_at: archivedAt,
        transferred_demand_id: transferred.id,
        transferred_network_name: networkName,
        updated_at: archivedAt,
      })
      .where('id', '=', demand.id)
      .execute();
    await queueModerationEmail(transaction, ctx, demand.id, archivedAt, {
      distance: network.distance,
      manager: network.manager,
      name: networkName,
    });
    await recordModeration(transaction, ctx, demand.id, { action: 'transfer', networkName, transferredDemandId: transferred.id });
    return { id: demand.id, transferredDemandId: transferred.id };
  });
};

/**
 * Cancels archival or an untouched transfer atomically, without notifying the user.
 */
export const restoreCcrtDemand = async (ctx: Context, input: z.infer<typeof zCcrtDemandId>) =>
  kdb.transaction().execute(async (transaction) => {
    const demand = await transaction
      .selectFrom('demands_chaleur_renouvelable')
      .select(['archived_at', 'transferred_network_name', 'transferred_demand_id'])
      .where('id', '=', input.demandId)
      .forUpdate()
      .executeTakeFirstOrThrow(notFound);
    if (!demand.archived_at) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Cette demande n’est plus archivée. Actualisez la liste.' });
    }
    const pendingEmail = await transaction
      .selectFrom('jobs')
      .select('id')
      .where('type', '=', 'ccrt_moderation_email')
      .where('entity_id', '=', input.demandId)
      .where((expression) => sql<string>`${expression.ref('data')}->>'deliveryStatus'`, '=', 'sending')
      .limit(1)
      .executeTakeFirst();
    if (pendingEmail) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Un email de modération est en cours d’envoi. Attendez sa fin avant d’annuler.' });
    }
    if (demand.transferred_demand_id) {
      await cancelTransferredDemand(transaction, demand.transferred_demand_id, ctx.user.id);
    }
    await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({
        archive_comment: null,
        archive_reason: null,
        archived_at: null,
        transferred_demand_id: null,
        transferred_network_name: null,
        updated_at: new Date(),
        validated: false,
      })
      .where('id', '=', input.demandId)
      .execute();
    await recordModeration(transaction, ctx, input.demandId, {
      action: 'restore',
      ...(demand.transferred_demand_id && {
        networkName: demand.transferred_network_name ?? undefined,
        transferredDemandId: demand.transferred_demand_id,
      }),
    });
    return { id: input.demandId };
  });

/**
 * Reads the private admin comment through an admin-only endpoint.
 */
export const getCcrtAdminComment = (input: z.infer<typeof zCcrtDemandId>) =>
  kdb.selectFrom('demands_chaleur_renouvelable').select('admin_comment').where('id', '=', input.demandId).executeTakeFirstOrThrow(notFound);

/**
 * Saves private text separately from shared notes and excludes its contents from the shared audit.
 */
export const updateCcrtAdminComment = async (ctx: Context, input: z.infer<typeof zCcrtAdminComment>) =>
  kdb.transaction().execute(async (transaction) => {
    await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({ admin_comment: input.comment })
      .where('id', '=', input.demandId)
      .returning('id')
      .executeTakeFirstOrThrow(notFound);
    await createUserEvent(
      {
        author_id: ctx.user.id,
        context_id: input.demandId,
        context_type: 'ccrt_demand',
        type: 'ccrt_demand_admin_comment_updated',
      },
      transaction
    );
    return { id: input.demandId };
  });

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' });
const lockPendingDemand = async (transaction: Transaction<DB>, demandId: string) => {
  const current = await selectDemandesChaleurRenouvelableForList(transaction)
    .select('acquisition')
    .where('id', '=', demandId)
    .forUpdate()
    .executeTakeFirstOrThrow(notFound);
  if (current.validated || current.archived_at) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Cette demande a déjà été validée, archivée ou transférée. Actualisez la liste.' });
  }
  return current;
};

const recordModeration = (transaction: Transaction<DB>, ctx: Context, demandId: string, data: EventDataMap['ccrt_demand_moderated']) =>
  createUserEvent(
    {
      author_id: ctx.user.id,
      context_id: demandId,
      context_type: 'ccrt_demand',
      data,
      type: 'ccrt_demand_moderated',
    },
    transaction
  );

const queueModerationEmail = (
  transaction: Transaction<DB>,
  ctx: Context,
  demandId: string,
  archivedAt: Date,
  network?: { name: string; distance: number | null; manager: string | null }
) =>
  transaction
    .insertInto('jobs')
    .values({
      data: { archivedAt: archivedAt.toISOString(), deliveryStatus: 'ready', demandId, network: network ?? null } satisfies z.infer<
        typeof zCcrtModerationEmailData
      >,
      entity_id: demandId,
      status: 'pending',
      type: 'ccrt_moderation_email',
      user_id: ctx.user.id,
    })
    .execute();
