import { type NextApiRequest } from 'next';

import { type UserRole } from '@/types/enum/UserRole';

export type Context = ReturnType<typeof buildContext>;

const buildContext = (req: NextApiRequest) => {
  const hasRole = (role: UserRole): boolean => {
    return req.user?.role === role;
  };

  return {
    user: req.user,
    userId: req.user?.id,
    headers: req.headers,
    session: req.session,
    query: req.query,
    hasRole,
  };
};

export default buildContext;
