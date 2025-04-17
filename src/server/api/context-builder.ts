import { type NextApiRequest } from 'next';

export type Context = ReturnType<typeof buildContext>;

const buildContext = (req: NextApiRequest) => {
  const hasRole = (role: string) => {
    return req.user?.roles.includes(role);
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
