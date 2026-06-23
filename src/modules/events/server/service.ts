import { jsonBuildObject } from 'kysely/helpers/postgres';

import { type Events, type Insertable, kdb, sql } from '@/server/db/kysely';
import type { UserRole } from '@/types/enum/UserRole';

import type { EventDataMap, EventGranularity, EventType } from '../constants';

type ListEventsOptions = {
  authorIds?: string[];
  context?: { type: string; id: string };
  organizationId?: string;
  types?: EventType[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
};

export type AdminEvent = {
  [T in EventType]: {
    id: string;
    author_id: string | null;
    type: T;
    context_type: string;
    context_id: string;
    data: EventDataMap[T];
    created_at: string;
    author: { id: string; email: string; role: UserRole } | null;
  };
}[EventType];

export async function listEvents(options: ListEventsOptions) {
  const { authorIds, context, organizationId, types, dateFrom, dateTo, limit = 50, offset = 0 } = options;

  let baseQuery = kdb.selectFrom('events');

  if (authorIds && authorIds.length > 0) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([eb('author_id', 'in', authorIds), eb.and([eb('context_type', '=', 'user'), eb('context_id', 'in', authorIds)])])
    );
  }
  if (context) {
    baseQuery = baseQuery.where('context_type', '=', context.type).where('context_id', '=', context.id);
  }
  if (organizationId) {
    baseQuery = baseQuery.where(sql<boolean>`data->>'organization_id' = ${organizationId}`);
  }
  if (types && types.length > 0) {
    baseQuery = baseQuery.where('type', 'in', types);
  }
  if (dateFrom) {
    baseQuery = baseQuery.where('events.created_at', '>=', dateFrom);
  }
  if (dateTo) {
    baseQuery = baseQuery.where('events.created_at', '<=', dateTo);
  }

  const [events, countResult] = await Promise.all([
    baseQuery
      .leftJoin('users', 'users.id', 'events.author_id')
      .select((eb) => [
        'events.id',
        'author_id',
        'type',
        'context_type',
        'context_id',
        'data',
        'events.created_at',
        eb
          .case()
          .when('users.id', 'is not', null)
          .then(jsonBuildObject({ email: eb.ref('users.email'), id: eb.ref('users.id'), role: eb.ref('users.role') }))
          .else(null)
          .end()
          .as('author'),
      ])
      .orderBy('events.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    baseQuery.select(sql<number>`COUNT(*)::int`.as('total')).executeTakeFirstOrThrow(),
  ]);

  return { events: events as unknown as AdminEvent[], total: countResult.total };
}

type EventStatsOptions = {
  types?: EventType[];
  authorIds?: string[];
  context?: { type: string; id: string };
  organizationId?: string;
  dateFrom: Date;
  dateTo: Date;
  granularity: EventGranularity;
};

export type EventStats = {
  timeSeries: { bucket: string; count: number }[];
  typeDistribution: { type: EventType; count: number }[];
  total: number;
};

export async function getEventStats(options: EventStatsOptions): Promise<EventStats> {
  const { types, authorIds, context, organizationId, dateFrom, dateTo, granularity } = options;

  const applyFilters = (query: ReturnType<typeof kdb.selectFrom<'events'>>, from: Date, to: Date) => {
    let q = query.where('created_at', '>=', from).where('created_at', '<=', to);
    if (types && types.length > 0) {
      q = q.where('type', 'in', types);
    }
    if (authorIds && authorIds.length > 0) {
      q = q.where((eb) =>
        eb.or([eb('author_id', 'in', authorIds), eb.and([eb('context_type', '=', 'user'), eb('context_id', 'in', authorIds)])])
      );
    }
    if (context) {
      q = q.where('context_type', '=', context.type).where('context_id', '=', context.id);
    }
    if (organizationId) {
      q = q.where(sql<boolean>`data->>'organization_id' = ${organizationId}`);
    }
    return q;
  };

  const [timeSeriesResult, distributionResult] = await Promise.all([
    applyFilters(kdb.selectFrom('events'), dateFrom, dateTo)
      .select([sql<string>`date_trunc(${sql.lit(granularity)}, created_at)`.as('bucket'), sql<number>`COUNT(*)::int`.as('count')])
      .groupBy(sql`1`)
      .orderBy(sql`1`)
      .execute(),
    applyFilters(kdb.selectFrom('events'), dateFrom, dateTo)
      .select(['type', sql<number>`COUNT(*)::int`.as('count')])
      .groupBy('type')
      .orderBy(sql`count`, 'desc')
      .execute(),
  ]);

  const total = timeSeriesResult.reduce((sum, row) => sum + row.count, 0);

  return {
    timeSeries: timeSeriesResult.map((row) => ({
      bucket: new Date(row.bucket).toISOString(),
      count: row.count,
    })),
    total,
    typeDistribution: distributionResult as { type: EventType; count: number }[],
  };
}

export async function createEvent(event: Pick<Insertable<Events>, 'type' | 'context_type' | 'context_id' | 'data'>) {
  await kdb.insertInto('events').values(event).execute();
}

export async function createUserEvent(
  event: Required<Pick<Insertable<Events>, 'author_id'>> & Pick<Insertable<Events>, 'type' | 'context_type' | 'context_id' | 'data'>
) {
  await kdb.insertInto('events').values(event).execute();
}

export async function searchAuthors(search: string) {
  return kdb.selectFrom('users').select(['id', 'email', 'role']).where('email', 'ilike', `%${search}%`).limit(20).execute();
}

export async function getAuthorsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return kdb.selectFrom('users').select(['id', 'email', 'role']).where('id', 'in', ids).execute();
}
