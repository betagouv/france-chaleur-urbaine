import { type NextApiRequest, type NextApiResponse } from 'next';

import { kdb } from '@/server/db/kysely';

export const apiUser = async (req: NextApiRequest, res: NextApiResponse) => {
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

  const account = await kdb.selectFrom('api_accounts').where('key', '=', key).selectAll().executeTakeFirst();
  if (!account || account.token !== bearerToken[1]) {
    res.status(401).json({
      message: 'Please check account key and token',
    });
    return null;
  }
  return account;
};
