import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { changePasswordWithResetToken, requestPassword } from '@/modules/auth/server/service';
import { route, router } from '@/modules/trpc/server';
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
              code: z.ZodIssueCode.custom,
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
  resetPassword: route.input(z.object({ email: z.email() })).mutation(async ({ input }) => await requestPassword(input.email)),
});
