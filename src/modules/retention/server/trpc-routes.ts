import { z } from 'zod';

import { adminRoute, router } from '@/modules/trpc/server';

import { retentionRules } from '../constants';
import { applyRetentionRule, previewRetention } from './service';

export const retentionRouter = router({
  archive: adminRoute
    .input(z.object({ rule: z.enum(retentionRules) }))
    .mutation(({ ctx, input }) => applyRetentionRule(input.rule, ctx.user.id)),
  preview: adminRoute.query(() => previewRetention()),
});
