import { type NextApiRequest } from 'next';

import { clientConfig } from '@/client-config';
import { handleRouteErrors } from '@/server/helpers/server';
import { register } from '@/server/services/auth';
import { registrationSchema } from '@/services/user';

const POST = async (req: NextApiRequest) => {
  if (!clientConfig.ENABLE_INSCRIPTIONS) {
    throw new Error('Les inscriptions sont désactivées');
  }
  const userData = await registrationSchema.parseAsync(req.body);

  return await register(userData);
};

export default handleRouteErrors({ POST });
