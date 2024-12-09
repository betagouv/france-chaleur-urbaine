import jwt from 'jsonwebtoken';
import type { NextApiRequest } from 'next';
import { z } from 'zod';

import db from '@/server/db';
import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';
import { sendResetPasswordEmail } from '@/services/email';
import { Airtable } from '@/types/enum/Airtable';

const reset = handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);

  const { email } = await validateObjectSchema(req.body, {
    email: z.string().email().toLowerCase().trim(),
  });

  const user = await db('users').where('email', email).andWhere('active', true).first();
  if (!user) {
    logger.warn('reset-password: missing user', { email });
    await AirtableDB(Airtable.CONNEXION).create([
      {
        fields: {
          Email: email,
          Date: new Date().toISOString(),
        },
      },
    ]);
    return;
  }

  const resetToken = Math.random().toString(36);
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / 1000) + 60 * 60 * 3, // 3 hour expiration
  };

  const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string);
  await db('users').update({ reset_token: resetToken }).where('id', user.id);
  await sendResetPasswordEmail(email, token);
});

export default reset;
