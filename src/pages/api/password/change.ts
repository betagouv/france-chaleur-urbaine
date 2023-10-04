import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import * as yup from 'yup';

const changePasswordSchema = yup.object().shape({
  password: yup.string().required(),
  token: yup.string().required(),
});

const changePasswordRequest = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.method !== 'POST') {
      return res.status(501);
    }

    if (!(await changePasswordSchema.isValid(req.body))) {
      return res
        .status(400)
        .send('Une erreur est survenue, veuillez ressayer...');
    }

    const decodedToken: { email: string; resetToken: string } = jwt.verify(
      req.body.token,
      process.env.NEXTAUTH_SECRET as string
    ) as { email: string; resetToken: string };

    if (!decodedToken) {
      return res
        .status(400)
        .send(
          'Lien invalide. Veuillez redemander un lien de réinitialisation.'
        );
    }

    const user = await db('users')
      .where('email', decodedToken.email)
      .andWhere('active', true)
      .first();
    if (!user) {
      return res.status(400).send('Email incorrect');
    }

    if (!user.reset_token) {
      return res
        .status(400)
        .send(
          'Ce lien a déjà été utilisé. Veuillez redemander un lien de réinitialisation.'
        );
    }

    if (user.reset_token !== decodedToken.resetToken) {
      return res
        .status(400)
        .send(
          'Lien invalide. Veuillez redemander un lien de réinitialisation.'
        );
    }

    const password = req.body.password as string;
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).send('Le mot de passe est trop simple.');
    }
    const salt = await bcrypt.genSalt(10);

    await db('users')
      .update({ reset_token: null, password: bcrypt.hashSync(password, salt) })
      .where('id', user.id);

    return res.status(200).send('Success');
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send('Une erreur est survenue, veuillez ressayer...');
  }
};

export default changePasswordRequest;
