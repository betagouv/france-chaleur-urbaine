import { TRPCError } from '@trpc/server';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import { kdb } from '@/server/db/kysely';

import type { zCcrtReopenDemand } from '../constants';

/**
 * Withdraws a published demand under a lock, preserving follow-up and preventing future new-demand notifications.
 */
export const reopenCcrtDemand = async (ctx: Context, input: z.infer<typeof zCcrtReopenDemand>) =>
  kdb.transaction().execute(async (transaction) => {
    const demand = await transaction
      .selectFrom('demands_chaleur_renouvelable')
      .select(['validated', 'archived_at', 'updated_at'])
      .where('id', '=', input.demandId)
      .forUpdate()
      .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));
    if (!demand.validated || demand.archived_at || demand.updated_at.toISOString() !== input.updatedAt) {
      throw new TRPCError({ code: 'CONFLICT', message: 'La demande a été modifiée. Vérifiez son suivi avant de la remettre à valider.' });
    }
    const pendingEmail = await transaction
      .selectFrom('ccrt_demand_emails')
      .select('id')
      .where('demand_id', '=', input.demandId)
      .where('status', '=', 'pending')
      .limit(1)
      .executeTakeFirst();
    if (pendingEmail) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Un email est en cours d’envoi sur cette demande. Attendez sa fin avant de la remettre à valider.',
      });
    }
    const now = new Date();
    await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({ reopened_at: now, updated_at: now, validated: false })
      .where('id', '=', input.demandId)
      .execute();
    await createUserEvent(
      {
        author_id: ctx.user.id,
        context_id: input.demandId,
        context_type: 'ccrt_demand',
        data: { action: 'reopen' },
        type: 'ccrt_demand_moderated',
      },
      transaction
    );
    return { id: input.demandId };
  });
