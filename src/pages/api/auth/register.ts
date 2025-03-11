import { type NextApiRequest } from 'next';

import { clientConfig } from '@/client-config';
import { zAccountRegisterRequest } from '@/pages/inscription';
import { handleRouteErrors } from '@/server/helpers/server';
import { register } from '@/server/services/auth';

const POST = async (req: NextApiRequest) => {
  if (!clientConfig.ENABLE_INSCRIPTIONS) {
    throw new Error('Les inscriptions sont désactivées');
  }
  const { email, password, role } = await zAccountRegisterRequest.parseAsync(req.body);

  return await register(email, password, role);
};

export default handleRouteErrors({ POST });
