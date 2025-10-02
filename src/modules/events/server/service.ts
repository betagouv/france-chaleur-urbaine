import { jsonBuildObject } from 'kysely/helpers/postgres';

import { type Events, type Insertable, kdb } from '@/server/db/kysely';

export type ListEventsOptions = {
  authorId?: string;
  context?: { type: string; id: string };
  type?: Events['type'];
};

export async function listEvents(options: ListEventsOptions) {
  const { authorId, context, type } = options;

  let dataQuery = kdb
    .selectFrom('events')
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
    ]);

  if (authorId) {
    dataQuery = dataQuery.where('author_id', '=', authorId);
  }
  if (context) {
    dataQuery = dataQuery.where('context_type', '=', context.type).where('context_id', '=', context.id);
  }
  if (type) {
    dataQuery = dataQuery.where('type', '=', type);
  }

  const events = await dataQuery.orderBy('events.created_at desc').limit(1000).execute();

  return events;
}

export type AdminEvent = Awaited<ReturnType<typeof listEvents>>['0'];

export async function createEvent(event: Pick<Insertable<Events>, 'type' | 'context_type' | 'context_id' | 'data'>) {
  await kdb.insertInto('events').values(event).execute();
}

export async function createUserEvent(
  event: Required<Pick<Insertable<Events>, 'author_id'>> & Pick<Insertable<Events>, 'type' | 'context_type' | 'context_id' | 'data'>
) {
  await kdb.insertInto('events').values(event).execute();
}
