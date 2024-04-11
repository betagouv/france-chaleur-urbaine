import {
  handleRouteErrors,
  requirePostMethod,
  validateObjectSchema,
} from '@helpers/server';
import { passwordSchema } from '@utils/validation/password';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import db from 'src/db';
import { BadRequestError } from 'src/services/errors';
import { z } from 'zod';

const changePasswordRequest = handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);

  const { password, token } = await validateObjectSchema(req.body, {
    password: passwordSchema,
    token: z.string().transform((token, ctx) => {
      const decodedToken = jwt.verify(
        req.body.token,
        process.env.NEXTAUTH_SECRET as string
      ) as { email: string; resetToken: string };
      if (!decodedToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Lien invalide. Veuillez redemander un lien de réinitialisation.',
        });

        return z.NEVER;
      }
      return decodedToken;
    }),
  });

  const user = await db('users')
    .where('email', token.email)
    .andWhere('active', true)
    .first();
  if (!user) {
    throw new BadRequestError('Email incorrect');
  }

  if (!user.reset_token) {
    throw new BadRequestError(
      'Ce lien a déjà été utilisé. Veuillez redemander un lien de réinitialisation.'
    );
  }

  if (user.reset_token !== token.resetToken) {
    throw new BadRequestError(
      'Lien invalide. Veuillez redemander un lien de réinitialisation'
    );
  }

  const salt = await bcrypt.genSalt(10);
  await db('users')
    .update({ reset_token: null, password: bcrypt.hashSync(password, salt) })
    .where('id', user.id);
});

export default changePasswordRequest;
