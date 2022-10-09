import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import base from 'src/db/airtable';
import { sendResetPasswordEmail } from 'src/services/email';
import * as yup from 'yup';

const resetPasswordSchema = yup.object().shape({
  email: yup.string().email().required(),
});

const reset = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(501);
  }

  if (!(await resetPasswordSchema.isValid(req.body))) {
    return res.status(400).send('Error');
  }

  const email = (req.body.email as string).toLowerCase();

  const user = await db('users').where('email', email).first();
  if (!user) {
    await base('FCU - Connexion espace gestionnaire').create([
      {
        fields: {
          Email: email,
          Date: new Date().toISOString(),
        },
      },
    ]);
    return res.status(200).send('Success');
  }

  const resetToken = Math.random().toString(36);
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiration
  };

  const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string);
  await db('users').update({ reset_token: resetToken }).where('id', user.id);
  await sendResetPasswordEmail(email as string, token);
  return res.status(200).send('Success');
};

export default reset;
