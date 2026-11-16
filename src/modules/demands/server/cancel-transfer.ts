import { TRPCError } from '@trpc/server';
import type { Transaction } from 'kysely';

import { createUserEvent } from '@/modules/events/server/service';
import type { DB } from '@/server/db/kysely';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { userRolesWithPermissionsHeatNetwork } from '@/types/enum/UserRole';

/** Soft-deletes an untouched transfer under the same demand lock as updates and email reservations. */
export const cancelTransferredDemand = async (transaction: Transaction<DB>, demandId: string, userId: string) => {
  const demand = await transaction
    .selectFrom('demands')
    .select(['legacy_values', 'comment_gestionnaire', 'pending_assignment_change'])
    .where('id', '=', demandId)
    .forUpdate()
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'CONFLICT', message: 'La demande de raccordement transférée est introuvable.' }));
  const [email, action] = await Promise.all([
    transaction.selectFrom('demand_emails').select('id').where('demand_id', '=', demandId).limit(1).executeTakeFirst(),
    transaction
      .selectFrom('events as event')
      .leftJoin('users as author', 'author.id', 'event.author_id')
      .select('event.id')
      .where('event.context_type', '=', 'demand')
      .where('event.context_id', '=', demandId)
      .where((expression) =>
        expression.or([
          expression('event.type', '=', 'api_demand_updated'),
          expression('author.role', 'in', userRolesWithPermissionsHeatNetwork),
        ])
      )
      .limit(1)
      .executeTakeFirst(),
  ]);
  if (
    demand.legacy_values.Status !== DEMANDE_STATUS.TO_PROCESS ||
    demand.comment_gestionnaire ||
    demand.pending_assignment_change ||
    email ||
    action
  ) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Le traitement de la demande de raccordement a commencé. Le transfert ne peut plus être annulé.',
    });
  }
  const deleted = await transaction
    .updateTable('demands')
    .set({ deleted_at: new Date(), updated_at: new Date() })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .returning('id')
    .executeTakeFirst();
  if (deleted) {
    await createUserEvent({ author_id: userId, context_id: demandId, context_type: 'demand', type: 'demand_deleted' }, transaction);
  }
};
