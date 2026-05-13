import { z } from 'zod';

import { emails, listEmailTypes, renderEmailScenario } from '@/modules/email/email.config';
import { adminRoute, router } from '@/modules/trpc/server';
import { ObjectKeys } from '@/utils/typescript';

const zEmailType = z.enum(ObjectKeys(emails));

export const emailRouter = router({
  list: adminRoute.query(() => listEmailTypes()),

  preview: adminRoute
    .input(
      z.object({
        scenarioKey: z.string().min(1),
        type: zEmailType,
      })
    )
    .query(async ({ input }) => {
      return renderEmailScenario(input.type, input.scenarioKey);
    }),
});
