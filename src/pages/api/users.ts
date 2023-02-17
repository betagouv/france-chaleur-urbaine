import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { authenticatedUser } from 'src/services/api/authentication';
import { USER_ROLE } from 'src/types/enum/UserRole';

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await authenticatedUser(req);
    if (!user || user.role !== USER_ROLE.ADMIN) {
      return res.status(204).json([]);
    }

    if (req.method === 'GET') {
      const users = await db('users')
        .select(['email', 'last_connection'])
        .whereNotNull('last_connection')
        .orderBy('last_connection', 'desc');
      return res.status(200).json(users);
    }

    return res.status(501);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
