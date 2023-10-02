import { nextAuthOptions } from '@pages/api/auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';
import { User, getServerSession } from 'next-auth';
import db from 'src/db';
import { ApiAccount } from 'src/types/ApiAccount';

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

export const apiUser = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ApiAccount | null> => {
  const { key } = req.query;

  if (!key) {
    res.status(400).json({
      message: 'Parameter key is required',
      code: 'Bad Arguments',
    });
    return null;
  }

  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({
      message: 'Please specify a Bearer token authorization',
    });
    return null;
  }

  const bearerToken = authorization.split(' ');
  if (bearerToken.length !== 2 || bearerToken[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      message: 'Please specify a Bearer token authorization',
    });
    return null;
  }

  const account: ApiAccount = await db('api_accounts')
    .where('key', key)
    .first();
  if (!account || account.token !== bearerToken[1]) {
    res.status(401).json({
      message: 'Please check account key and token',
    });
    return null;
  }
  return account;
};
