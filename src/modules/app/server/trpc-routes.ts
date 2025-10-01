import { route, router } from '@/modules/trpc/server/connection';

import { contactFormSchema } from '../constants';
import { createContact } from './contact-service';

export const contactRouter = router({
  create: route.input(contactFormSchema).mutation(async ({ input }) => {
    return await createContact(input);
  }),
});

export const appRouter = router({
  contact: contactRouter,
});
