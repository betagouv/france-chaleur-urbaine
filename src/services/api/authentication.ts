import { nextAuthOptions } from '@pages/api/auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';
import { User, getServerSession } from 'next-auth';
import db from 'src/db';

export const authenticatedUser = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> => {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session) {
    return null;
  }

  await db('users')
    .where({ email: session.user.email })
    .update({ last_connection: new Date() });

  return session.user;
};
