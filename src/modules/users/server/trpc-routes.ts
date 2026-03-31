import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';

import { buildRubriques } from '@/modules/ademe-connect/constants';
import { updateContact } from '@/modules/ademe-connect/server/client';
import { createUserEvent } from '@/modules/events/server/service';
import { routeAuthenticated, router } from '@/modules/trpc/server/connection';
import { structureTypesLabels, zUpdateNewsletterSchema, zUpdateProfileSchema } from '@/modules/users/constants';
import * as usersService from '@/modules/users/server/service';
import { logger } from '@/server/helpers/logger';

export const usersRouter = router({
  getProfile: routeAuthenticated.query(async ({ ctx }) => {
    const user = await usersService.getProfile(ctx.user.id);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouvé' });
    }

    return user;
  }),

  updateNewsletterSubscription: routeAuthenticated.input(zUpdateNewsletterSchema).mutation(async ({ ctx, input }) => {
    await usersService.updateNewsletterSubscription(ctx.user.id, input.optin_newsletter);

    await createUserEvent({
      author_id: ctx.user.id,
      context_id: ctx.user.id,
      context_type: 'user',
      type: input.optin_newsletter ? 'user_newsletter_subscribed' : 'user_newsletter_unsubscribed',
    });

    const now = dayjs().format('YYYY-MM-DD');
    updateContact(ctx.user.email, {
      abonnementNewsletter: input.optin_newsletter,
      ...(input.optin_newsletter ? { dateNewsletter: now } : { dateFinNewsletter: now }),
    }).catch((error) =>
      logger.error('ademe-connect updateContact failed on updateNewsletterSubscription', { error, user_id: ctx.user.id })
    );
  }),

  updateProfile: routeAuthenticated.input(zUpdateProfileSchema).mutation(async ({ ctx, input }) => {
    const success = await usersService.updateProfile(ctx.user.id, input);

    if (!success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du profil' });
    }

    await createUserEvent({
      author_id: ctx.user.id,
      context_id: ctx.user.id,
      context_type: 'user',
      type: 'user_updated',
    });

    updateContact(ctx.user.email, {
      nom: input.last_name,
      prenom: input.first_name,
      rubriques: buildRubriques(ctx.user.role, input.structure_type && structureTypesLabels[input.structure_type]),
      telephone: input.phone ?? undefined,
    }).catch((error) => logger.error('ademe-connect updateContact failed on updateProfile', { error, user_id: ctx.user.id }));
  }),
});
