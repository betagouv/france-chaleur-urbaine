import { z } from 'zod';

import { routeRole, router } from '@/modules/trpc/server';

import * as tagsService from './service';

const zUpdateTagReminderInput = z.object({
  tagId: z.string(),
});

const zUpdateTagCommentInput = z.object({
  comment: z.string().trim().nullable(),
  tagId: z.string(),
});

export const tagsRouter = router({
  admin: {
    createReminder: routeRole(['admin'])
      .input(zUpdateTagReminderInput)
      .mutation(({ input, ctx }) => tagsService.createTagReminder(input.tagId, ctx.user.id)),
    deleteReminder: routeRole(['admin'])
      .input(zUpdateTagReminderInput)
      .mutation(({ input, ctx }) => tagsService.deleteTagReminder(input.tagId, ctx.user.id)),
    updateComment: routeRole(['admin'])
      .input(zUpdateTagCommentInput)
      .mutation(({ input, ctx }) => tagsService.updateTagComment(input.tagId, input.comment, ctx.user.id)),
  },
});
