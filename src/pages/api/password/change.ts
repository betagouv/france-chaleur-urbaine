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
  if (req.method !== 'POST') {
    return res.status(501);
  }

  if (!(await changePasswordSchema.isValid(req.body))) {
    return res.status(400).send('Error');
  }

  const decodedToken: { email: string; resetToken: string } = jwt.verify(
    req.body.token,
    process.env.NEXTAUTH_SECRET as string
  ) as { email: string; resetToken: string };

  if (!decodedToken) {
    return res.status(400).send('Error');
  }

  const user = await db('users')
    .where('email', decodedToken.email)
    .andWhere('reset_token', decodedToken.resetToken)
    .first();
  if (!user) {
    return res.status(400).send('Error');
  }

  const password = req.body.password as string;
  if (
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return res.status(400).send('Error');
  }
  const salt = await bcrypt.genSalt(10);

  await db('users')
    .update({ reset_token: null, password: bcrypt.hashSync(password, salt) })
    .where('id', user.id);

  return res.status(200).send('Success');
};

export default changePasswordRequest;
