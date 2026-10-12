import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import type { EventDataMap, EventType } from '@/modules/events/constants';
import type { AdminEvent } from '@/modules/events/server/service';
import { territoryPermissionToColumn } from '@/modules/permissions/types';
import { kdb, sql } from '@/server/db/kysely';

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
 * Returns a shared timeline with only the permission changes that concern this demand's territory.
 */
export const getCcrtFollowUp = async (ctx: Context, input: z.infer<typeof zCcrtFollowUpInput>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const scopes = Object.entries(territoryPermissionToColumn).flatMap(([type, column]) =>
    demand[column] ? [{ resource_id: demand[column], type }] : []
  );
  const historyQuery = kdb
    .selectFrom('events')
    .leftJoin('users as author', 'author.id', 'events.author_id')
    .where((expression) =>
      expression.or([
        expression.and([expression('context_type', '=', 'ccrt_demand'), expression('context_id', '=', demand.id)]),
        expression.and([
          expression('type', 'in', ['user_permissions_updated', 'user_permissions_synced_from_api']),
          expression('context_type', '=', 'user'),
          expression('events.created_at', '>=', demand.created_at),
          scopes.length
            ? expression.or(
                scopes.flatMap((scope) =>
                  ['added', 'removed'].map((key) => sql<boolean>`${expression.ref('data')} @> ${JSON.stringify({ [key]: [scope] })}::jsonb`)
                )
              )
            : sql.lit(false),
        ]),
      ])
    );
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
    listCcrtUsersWithAccess(ctx, demand.id),
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
    emails: emails.map((email) => ({ ...email, email_key: email.id, sent_at: email.sent_at?.toISOString() ?? null })),
    history: history.map((event) => {
      if (event.type === 'user_permissions_updated' || event.type === 'user_permissions_synced_from_api') {
        const permissionsData = event.data as EventDataMap['user_permissions_updated'];
        const matchesScope = (permission: { type: string; resource_id: string | null }) =>
          scopes.some((scope) => scope.type === permission.type && scope.resource_id === permission.resource_id);
        return {
          ...event,
          created_at: event.created_at.toISOString(),
          data: {
            added: permissionsData.added.filter(matchesScope),
            removed: (permissionsData.removed ?? []).filter(matchesScope),
            user_email: permissionsData.user_email,
          },
        };
      }
      return { ...event, created_at: event.created_at.toISOString() };
    }) as CcrtHistoryEvent[],
    notes: notes.map((note) => ({ ...note, created_at: note.created_at.toISOString(), updated_at: note.updated_at.toISOString() })),
    total: Number(count.count),
    users,
  };
};
