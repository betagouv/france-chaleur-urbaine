import { route, router } from '@/modules/trpc/server/connection';

import { contactFormSchema } from '../constants';
import { createContact } from './contact-service';

export const contactRouter = router({
  create: route
    .meta({
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 1,
        message: "Vous ne pouvez envoyer qu'un message par minute. Veuillez patienter avant de soumettre un nouveau message.",
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
