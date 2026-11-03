import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { resetUserMfa } from '@/modules/auth/server/mfa';
import { changePasswordWithResetToken, requestPassword } from '@/modules/auth/server/service';
import { adminRoute, route, router } from '@/modules/trpc/server';
import { zPassword } from '@/utils/validation';

export const authRouter = router({
  changePassword: route
    .input(
      z.object({
        password: zPassword,
        token: z.string().transform((token, ctx) => {
          try {
            const decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
              email: string;
              resetToken: string;
            };

            return decodedToken;
          } catch (_err) {
            ctx.addIssue({
              code: 'custom',
              message: 'Lien invalide. Veuillez réinitialiser votre mot de passe.',
            });

            return z.NEVER;
          }
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { password, token } = input;
      await changePasswordWithResetToken({ password, token });
    }),
  resetPassword: route
    .meta({
      rateLimit: {
        limit: 5,
        message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans quelques minutes.',
        windowMs: 15 * 60 * 1000,
      },
    })
    .input(z.object({ email: z.email() }))
    .mutation(async ({ input }) => await requestPassword(input.email)),
  /** Drops the second factor of a user (lost phone): a new enrollment is required at their next login. */
  resetUserMfa: adminRoute.input(z.object({ userId: z.uuidv4() })).mutation(({ ctx, input }) => resetUserMfa(input.userId, ctx.user.id)),
});
