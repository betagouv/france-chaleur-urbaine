import { type NextApiRequest, type NextApiResponse } from 'next';

import { getServerSession } from '@/server/authentication';
import { parentLogger } from '@/server/helpers/logger';
import { type UserRole } from '@/types/enum/UserRole';

export type Context = Awaited<ReturnType<typeof buildContext>>;

const buildContext = async (req: NextApiRequest, res?: NextApiResponse) => {
  // Only populate session if not already populated (like in handleRouteErrors)
  if (!req.session && res) {
    req.session = await getServerSession({ req, res });
    req.user = req.session?.user;
  }

  const hasRole = (role: UserRole): boolean => {
    return req.user?.role === role;
  };

  const logger = parentLogger.child({
    user: process.env.LOG_REQUEST_USER ? req.user?.id : undefined,
  });

  return {
    user: req.user,
    userId: req.user?.id,
    headers: req.headers,
    session: req.session,
    query: req.query,
    hasRole,
    logger,
  };
};

export default buildContext;
