import type { Transaction } from 'kysely';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import type { DB } from '@/server/db/kysely';

import type { zCcrtCreateNote } from '../constants';

/**
 * Inserts a note and its audit in the caller's transaction, including combined status/note submissions.
 */
export const insertCcrtNote = async (ctx: Context, input: z.infer<typeof zCcrtCreateNote>, transaction: Transaction<DB>) => {
  const note = await transaction
    .insertInto('ccrt_demand_notes')
    .values({ author_id: ctx.user.id, body: input.body, demand_id: input.demandId })
    .returning('id')
    .executeTakeFirstOrThrow();
  await createUserEvent(
    {
      author_id: ctx.user.id,
      context_id: input.demandId,
      context_type: 'ccrt_demand',
      data: { noteId: note.id },
      type: 'ccrt_demand_note_created',
    },
    transaction
  );
  return note;
};
