import { z } from 'zod';

import { routeRole, router } from '@/modules/trpc/server';

import * as tagsService from './service';

const zUpdateTagReminderInput = z.object({
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
  },
});
