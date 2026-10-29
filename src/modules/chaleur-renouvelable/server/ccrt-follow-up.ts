import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import type { EventType } from '@/modules/events/constants';
import type { AdminEvent } from '@/modules/events/server/service';
import { kdb } from '@/server/db/kysely';

import type { zCcrtFollowUpInput } from '../constants';
import { ensureCcrtDemandAccess, listCcrtUsersWithAccess } from './ccrt-access';

type CcrtHistoryEvent = {
  [Type in EventType]: Pick<Extract<AdminEvent, { type: Type }>, 'id' | 'type' | 'data' | 'created_at'> & {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}[EventType];

/**
 * Returns the shared timeline of events recorded on this demand.
 */
export const getCcrtFollowUp = async (ctx: Context, input: z.infer<typeof zCcrtFollowUpInput>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const historyQuery = kdb
    .selectFrom('events')
    .leftJoin('users as author', 'author.id', 'events.author_id')
    .where('context_type', '=', 'ccrt_demand')
    .where('context_id', '=', demand.id);
  const [notes, emails, users, history, count] = await Promise.all([
    kdb
      .selectFrom('ccrt_demand_notes')
      .leftJoin('users as author', 'author.id', 'ccrt_demand_notes.author_id')
      .select([
        'ccrt_demand_notes.id',
        'body',
        'ccrt_demand_notes.created_at',
        'ccrt_demand_notes.updated_at',
        'author.email',
        'author.first_name',
        'author.last_name',
      ])
      .where('demand_id', '=', demand.id)
      .orderBy('ccrt_demand_notes.created_at', 'desc')
      .execute(),
    kdb
      .selectFrom('ccrt_demand_emails')
      .select(['id', 'body', 'cc', 'object', 'reply_to', 'signature', 'to', 'sent_at'])
      .where('demand_id', '=', demand.id)
      .where('status', '=', 'sent')
      .orderBy('sent_at', 'desc')
      .execute(),
    listCcrtUsersWithAccess(demand),
    historyQuery
      .select(['events.id', 'type', 'data', 'events.created_at', 'author.email', 'author.first_name', 'author.last_name'])
      .orderBy('events.created_at', 'desc')
      .orderBy('events.id', 'desc')
      .limit(20)
      .offset(input.offset)
      .execute(),
    historyQuery.select(kdb.fn.count<number>('events.id').as('count')).executeTakeFirstOrThrow(),
  ]);
  return {
    emails: emails.map((email) => ({ ...email, sent_at: email.sent_at?.toISOString() ?? null })),
    history: history.map((event) => ({ ...event, created_at: event.created_at.toISOString() })) as CcrtHistoryEvent[],
    notes: notes.map((note) => ({ ...note, created_at: note.created_at.toISOString(), updated_at: note.updated_at.toISOString() })),
    total: Number(count.count),
    users,
  };
};
