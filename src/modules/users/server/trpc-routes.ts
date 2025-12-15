import { TRPCError } from '@trpc/server';
import { routeAuthenticated, router } from '@/modules/trpc/server/connection';
import { zUpdateProfileSchema } from '@/modules/users/constants';
import { kdb } from '@/server/db/kysely';

export const usersRouter = router({
  getProfile: routeAuthenticated.query(async ({ ctx }) => {
    const user = await kdb
      .selectFrom('users')
      .select(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type', 'structure_other'])
      .where('id', '=', ctx.user.id)
      .executeTakeFirst();

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouvé' });
    }

    return user;
  }),

  updateProfile: routeAuthenticated.input(zUpdateProfileSchema).mutation(async ({ ctx, input }) => {
    const [updatedUser] = await kdb
      .updateTable('users')
      .set(input)
      .where('id', '=', ctx.user.id)
      .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type', 'structure_other'])
      .execute();

    if (!updatedUser) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du profil' });
    }

    return updatedUser;
  }),
});
