import { TRPCError } from '@trpc/server';
import type { Transaction } from 'kysely';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import type { DB } from '@/server/db/kysely';

import {
  type AdminUpdateDemandeChaleurRenouvelableInput,
  type CcrtUpdateDemandeChaleurRenouvelableInput,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
} from '../constants';
import { insertCcrtNote } from './ccrt-notes';

type ApplyCcrtFollowUpUpdateInput = {
  demandId: string;
  trigger?: CcrtUpdateDemandeChaleurRenouvelableInput['trigger'];
  values: AdminUpdateDemandeChaleurRenouvelableInput['values'] & CcrtUpdateDemandeChaleurRenouvelableInput['values'];
};

/**
 * Updates follow-up and its audit under one lock, preserving concurrent manual changes on automatic contact.
 * The caller checks access and owns the transaction, including any email or note being recorded.
 */
export const applyCcrtFollowUpUpdate = async (ctx: Context, input: ApplyCcrtFollowUpUpdateInput, transaction: Transaction<DB>) => {
  const current = await transaction
    .selectFrom('demands_chaleur_renouvelable')
    .select(['id', 'assigned_to', 'status', 'project_state', 'updated_at'])
    .where('id', '=', input.demandId)
    .forUpdate()
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));
  const isContactSkipped = input.trigger === 'contact' && current.status !== DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS;
  const values = isContactSkipped ? {} : input.values;
  const status = values.status ?? current.status;
  const nextValues = {
    assigned_to: values.assignedTo === undefined ? current.assigned_to : values.assignedTo,
    status,
  };
  const changes = {
    ...(current.assigned_to !== nextValues.assigned_to && { assigned_to: { from: current.assigned_to, to: nextValues.assigned_to } }),
    ...(current.status !== nextValues.status && { status: { from: current.status, to: nextValues.status } }),
  };
  const demand = Object.keys(changes).length
    ? await transaction
        .updateTable('demands_chaleur_renouvelable')
        .set({ ...nextValues, updated_at: new Date() })
        .where('id', '=', input.demandId)
        .returning(['id', 'assigned_to', 'status', 'project_state', 'updated_at'])
        .executeTakeFirstOrThrow()
    : current;
  if (Object.keys(changes).length) {
    await createUserEvent(
      { author_id: ctx.user.id, context_id: demand.id, context_type: 'ccrt_demand', data: { changes }, type: 'ccrt_demand_updated' },
      transaction
    );
  }
  if (values.note) {
    await insertCcrtNote(ctx, { body: values.note, demandId: demand.id }, transaction);
  }
  return { changes, demand, noteCreated: Boolean(values.note) };
};
