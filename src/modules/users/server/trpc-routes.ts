import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { z } from 'zod';

import { ALL_FCU_RUBRIQUES, buildRubriques } from '@/modules/ademe-connect/constants';
import { updateContact } from '@/modules/ademe-connect/server/client';
import { createUserEvent } from '@/modules/events/server/service';
import { adminRoute } from '@/modules/trpc/server';
import { routeAuthenticated, router } from '@/modules/trpc/server/connection';
import {
  zBulkAddUserTags,
  zCreateUserTag,
  zSetUserTags,
  zUpdateNewsletterSchema,
  zUpdateProfileSchema,
  zUpdateUserTag,
} from '@/modules/users/constants';
import * as usersService from '@/modules/users/server/service';
import * as tagsService from '@/modules/users/server/tags-service';
import { logger } from '@/server/helpers/logger';

export const usersRouter = router({
  // Gestion admin des étiquettes utilisateurs (catalogue + affectations).
  adminTags: {
    addToUsers: adminRoute
      .input(zBulkAddUserTags)
      .mutation(({ ctx, input }) => tagsService.addTagsToUsersByEmail(input.tagIds, input.emails, ctx.user.id)),

    create: adminRoute.input(zCreateUserTag).mutation(({ ctx, input }) => tagsService.createTag(input.name, input.color, ctx.user.id)),

    delete: adminRoute.input(z.object({ id: z.uuidv4() })).mutation(({ ctx, input }) => tagsService.deleteTag(input.id, ctx.user.id)),

    getForUser: adminRoute.input(z.object({ userId: z.uuidv4() })).query(({ input }) => tagsService.getUserTags(input.userId)),

    list: adminRoute.query(() => tagsService.listTags()),

    setForUser: adminRoute
      .input(zSetUserTags)
      .mutation(({ ctx, input }) => tagsService.setUserTags(input.userId, input.tagIds, ctx.user.id)),

    update: adminRoute
      .input(zUpdateUserTag)
      .mutation(({ ctx, input }) => tagsService.updateTag(input.id, { color: input.color, name: input.name }, ctx.user.id)),
  },

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

    updateContact(ctx.user.email, {
      nom: input.last_name,
      prenom: input.first_name,
      rubriques: buildRubriques(ctx.user.role, input.structure_type),
      rubriquesASupprimer: ALL_FCU_RUBRIQUES,
      telephone: input.phone ?? undefined,
    }).catch((error) => logger.error('ademe-connect updateContact failed on updateProfile', { error, user_id: ctx.user.id }));

    await createUserEvent({
      author_id: ctx.user.id,
      context_id: ctx.user.id,
      context_type: 'user',
      data: { changes: input },
      type: 'user_profile_updated',
    });
  }),
});
