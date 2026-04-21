import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminRoute, routeAuthenticated, router } from '@/modules/trpc/server/connection';
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

  lookupSiret: adminRoute
    .input(z.object({ siret: z.string().length(14) }))
    .query(async ({ input }) => usersService.lookupSiret(input.siret)),

  updateProfile: routeAuthenticated.input(zUpdateProfileSchema).mutation(async ({ ctx, input }) => {
    const success = await usersService.updateProfile(ctx.user.id, input);

    if (!success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du profil' });
    }
  }),
});
