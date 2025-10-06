import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from '@/server/authentication';
import { parentLogger } from '@/server/helpers/logger';
import type { UserRole } from '@/types/enum/UserRole';

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

  // Attention le contexte est partagé parmi toutes les requêtes trpc batchées
  const logger = parentLogger.child({
    ip: process.env.LOG_REQUEST_IP ? (req.headers['x-forwarded-for'] ?? req.socket.remoteAddress) : undefined,
    user: process.env.LOG_REQUEST_USER ? req.user?.id : undefined,
  });

  return {
    hasRole,
    headers: req.headers,
    logger,
    query: req.query,
    session: req.session,
    user: req.user,
    userId: req.user?.id,
  };
};

export default buildContext;
