import type { NextApiRequest } from 'next';

import { register } from '@/modules/auth/server/service';
import { registrationSchema } from '@/modules/users/constants';
import { handleRouteErrors } from '@/server/helpers/server';

const POST = async (req: NextApiRequest) => {
  const userData = await registrationSchema.parseAsync(req.body);

  return await register(userData);
};

export default handleRouteErrors({ POST });
