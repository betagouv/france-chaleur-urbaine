import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { activateUser } from '@/modules/auth/server/service';
import { route, router } from '@/modules/trpc/server';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { sendEmailTemplate } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { BadRequestError } from '@/server/helpers/server';
import { Airtable } from '@/types/enum/Airtable';
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

      const user = await kdb
        .selectFrom('users')
        .selectAll()
        .where('email', '=', token.email)
        .where('active', 'is', true)
        .executeTakeFirst();

      if (!user) {
        throw new BadRequestError('Email incorrect');
      }

      if (!user.reset_token) {
        throw new BadRequestError('Ce lien a déjà été utilisé. Veuillez refaire une demande de réinitialisation de votre mot de passe.');
      }

      if (user.reset_token !== token.resetToken) {
        throw new BadRequestError('Lien invalide. Veuillez réinitialiser votre mot de passe.');
      }

      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await kdb
        .updateTable('users')
        .set({
          password: hashedPassword,
          reset_token: null,
        })
        .where('id', '=', user.id)
        .execute();

      if (user.activation_token) {
        await activateUser(user.activation_token);
      }
    }),
  resetPassword: route.input(z.object({ email: z.string().email().toLowerCase().trim() })).mutation(async ({ input }) => {
    const user = await kdb.selectFrom('users').selectAll().where('email', '=', input.email).where('active', 'is', true).executeTakeFirst();

    if (!user) {
      logger.warn('reset-password: missing user', { email: input.email });
      await AirtableDB(Airtable.CONNEXION).create([
        {
          fields: {
            Date: new Date().toISOString(),
            Email: input.email,
          },
        },
      ]);
      return;
    }

    const resetToken = Math.random().toString(36);
    const payload = {
      email: input.email,
      exp: Math.round(Date.now() / 1000) + 60 * 60 * 3, // 3 hour expiration
      resetToken,
    };

    const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string);
    await kdb.updateTable('users').set({ reset_token: resetToken }).where('id', '=', user.id).execute();
    await sendEmailTemplate('reset-password', user, { token });
  }),
});
