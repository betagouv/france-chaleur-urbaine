import type { NextApiRequest, NextApiResponse } from 'next';

import { getUserPermissions } from '@/modules/permissions/server/service';
import type { Permission } from '@/modules/permissions/types';
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

  // When impersonating, use the permissions from the JWT instead of the DB
  const impersonatedPermissions = req.session?.impersonatedPermissions as Permission[] | undefined;

  const getPermissions = async (): Promise<Permission[]> => {
    if (impersonatedPermissions) {
      return impersonatedPermissions;
    }
    if (req.user?.id) {
      return getUserPermissions(req.user.id);
    }
    return [];
  };

  // Anonymization toggle via cookie (admin only)
  const anonymize = hasRole('admin') && req.cookies?.['fcu-anonymize'] === '1';

  return {
    anonymize,
    getPermissions,
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
