import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type NextApiRequest } from 'next';
import { z } from 'zod';

import db from '@/server/db';
import { BadRequestError, handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';
import { activateUser } from '@/server/services/auth';
import { zPassword } from '@/utils/validation';

const changePasswordRequest = handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);

  const { password, token } = await validateObjectSchema(req.body, {
    password: zPassword,
    token: z.string().transform((token, ctx) => {
      try {
        const decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as { email: string; resetToken: string };

        return decodedToken;
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lien invalide. Veuillez réinitialiser votre mot de passe.',
        });

        return z.NEVER;
      }
    }),
  });

  const user = await db('users').where('email', token.email).andWhere('active', true).first();
  if (!user) {
    throw new BadRequestError('Email incorrect');
  }

  if (!user.reset_token) {
    throw new BadRequestError('Ce lien a déjà été utilisé. Veuillez refaire une demande de réinitialisation de votre mot de passe.');
  }

  if (user.reset_token !== token.resetToken) {
    throw new BadRequestError('Lien invalide. Veuillez réinitialiser votre mot de passe.');
  }

  const salt = await bcrypt.genSalt(10);
  await db('users')
    .update({ reset_token: null, password: bcrypt.hashSync(password, salt) })
    .where('id', user.id);

  if (user.activation_token) {
    await activateUser(user.activation_token);
  }
});

export default changePasswordRequest;
