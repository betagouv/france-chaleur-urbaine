import { route, router } from '@/modules/trpc/server/connection';

import { contactFormSchema } from '../constants';
import { createContact } from './contact-service';

export const contactRouter = router({
  create: route
    .meta({
      rateLimit: {
        limit: 1,
        message: 'Veuillez patienter quelques minutes avant de soumettre un nouveau message.',
        windowMs: 60 * 1000, // 1 minute
      },
    })
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      return await createContact(input);
    }),
});

export const appRouter = router({
  contact: contactRouter,
});
