import { TRPCError } from '@trpc/server';

import { updateContact } from '@/modules/ademe-connect/server/client';
import { routeAuthenticated, router } from '@/modules/trpc/server/connection';
import { zUpdateProfileSchema } from '@/modules/users/constants';
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

  updateProfile: routeAuthenticated.input(zUpdateProfileSchema).mutation(async ({ ctx, input }) => {
    const success = await usersService.updateProfile(ctx.user.id, input);

    if (!success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du profil' });
    }

    updateContact(ctx.user.email, {
      nom: input.last_name,
      prenom: input.first_name,
      telephone: input.phone ?? undefined,
    }).catch((error) => logger.error('ademe-connect updateContact failed on updateProfile', { error, user_id: ctx.user.id }));
  }),
});
