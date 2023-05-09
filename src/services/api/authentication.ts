import { NextApiRequest } from 'next';
import { User } from 'next-auth';
import { getSession } from 'next-auth/react';
import db from 'src/db';

export const authenticatedUser = async (
  req: NextApiRequest
): Promise<User | null> => {
  const session = await getSession({ req });
  if (!session) {
    return null;
  }

  await db('users')
    .where({ email: session.user.email })
    .update({ last_connection: new Date() });

  return session.user;
};
