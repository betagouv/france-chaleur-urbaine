import { z } from 'zod';

import { emails, listEmailTypes, renderEmailScenario } from '@/modules/email/email.config';
import { adminRoute, router } from '@/modules/trpc/server';
import { ObjectKeys } from '@/utils/typescript';

import {
  getDeliverabilitySettings,
  getEmailDeliverability,
  listBlockedContacts,
  listEmailEventsForAdmin,
  syncBlockedContacts,
  unblockEmail,
} from './deliverability-service';

const zEmailType = z.enum(ObjectKeys(emails));

export const emailRouter = router({
  // Brevo deliverability (admin only): mirrored blocklist + live events, see deliverability-service.ts
  deliverability: {
    getEmailDeliverability: adminRoute.input(z.object({ email: z.email() })).query(({ input }) => getEmailDeliverability(input.email)),
    getSettings: adminRoute.query(() => getDeliverabilitySettings()),
    listBlockedContacts: adminRoute.query(() => listBlockedContacts()),
    listEmailEvents: adminRoute.input(z.object({ email: z.email() })).query(({ input }) => listEmailEventsForAdmin(input.email)),
    syncBlockedContacts: adminRoute.mutation(() => syncBlockedContacts()),
    unblockContact: adminRoute
      .input(z.object({ email: z.email() }))
      .mutation(({ input, ctx }) => unblockEmail(input.email, { adminUserId: ctx.user.id })),
  },

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
