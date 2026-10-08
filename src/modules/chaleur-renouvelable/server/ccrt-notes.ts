import { TRPCError } from '@trpc/server';
import type { Transaction } from 'kysely';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import { type DB, kdb, sql } from '@/server/db/kysely';

import type { zCcrtCreateNote, zCcrtDeleteNote, zCcrtUpdateNote } from '../constants';
import { ensureCcrtDemandAccess } from './ccrt-access';

export const createCcrtNote = async (ctx: Context, input: z.infer<typeof zCcrtCreateNote>) => {
  await ensureCcrtDemandAccess(ctx, input.demandId);
  return kdb.transaction().execute((transaction) => insertCcrtNote(ctx, input, transaction));
};

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

/**
 * Shared notes remain editable by authorized users; stale edits cannot overwrite a colleague's correction.
 */
export const updateCcrtNote = async (ctx: Context, input: z.infer<typeof zCcrtUpdateNote>) => {
  await ensureCcrtDemandAccess(ctx, input.demandId);
  return kdb.transaction().execute(async (transaction) => {
    const note = await transaction
      .updateTable('ccrt_demand_notes')
      .set({ body: input.body, updated_at: new Date() })
      .where('id', '=', input.noteId)
      .where('demand_id', '=', input.demandId)
      .where((expression) => sql<boolean>`date_trunc('milliseconds', ${expression.ref('updated_at')}) = ${new Date(input.updatedAt)}`)
      .returning('id')
      .executeTakeFirst();
    if (!note) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Cette note a été modifiée ou supprimée. Rechargez le suivi.' });
    }
    await createUserEvent(
      {
        author_id: ctx.user.id,
        context_id: input.demandId,
        context_type: 'ccrt_demand',
        data: { noteId: note.id },
        type: 'ccrt_demand_note_updated',
      },
      transaction
    );
    return note;
  });
};

export const deleteCcrtNote = async (ctx: Context, input: z.infer<typeof zCcrtDeleteNote>) => {
  await ensureCcrtDemandAccess(ctx, input.demandId);
  return kdb.transaction().execute(async (transaction) => {
    const note = await transaction
      .deleteFrom('ccrt_demand_notes')
      .where('id', '=', input.noteId)
      .where('demand_id', '=', input.demandId)
      .where((expression) => sql<boolean>`date_trunc('milliseconds', ${expression.ref('updated_at')}) = ${new Date(input.updatedAt)}`)
      .returning('id')
      .executeTakeFirst();
    if (!note) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Cette note a été modifiée ou supprimée. Rechargez le suivi.' });
    }
    await createUserEvent(
      {
        author_id: ctx.user.id,
        context_id: input.demandId,
        context_type: 'ccrt_demand',
        data: { noteId: note.id },
        type: 'ccrt_demand_note_deleted',
      },
      transaction
    );
    return note;
  });
};
