import { type NextApiRequest } from 'next';

import { zAccountRegisterRequest } from '@/pages/inscription';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { register } from '@/server/services/auth';

const route = async (req: NextApiRequest) => {
  requirePostMethod(req);
  const { email, password, role } = await zAccountRegisterRequest.parseAsync(req.body);

  return await register(email, password, role);
};

export default handleRouteErrors(route);
