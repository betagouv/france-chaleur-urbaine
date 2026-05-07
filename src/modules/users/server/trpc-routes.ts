import { TRPCError } from '@trpc/server';

import { createUserEvent } from '@/modules/events/server/service';
import { routeAuthenticated, router } from '@/modules/trpc/server/connection';
import { zUpdateProfileSchema } from '@/modules/users/constants';
import * as usersService from '@/modules/users/server/service';

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

    await createUserEvent({
      author_id: ctx.user.id,
      context_id: ctx.user.id,
      context_type: 'user',
      data: { changes: input },
      type: 'user_profile_updated',
    });
  }),
});
