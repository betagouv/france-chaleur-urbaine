import { type NextApiRequest } from 'next';

import { registrationSchema } from '@/modules/users/constants';
import { handleRouteErrors } from '@/server/helpers/server';
import { register } from '@/server/services/auth';

const POST = async (req: NextApiRequest) => {
  const userData = await registrationSchema.parseAsync(req.body);

  return await register(userData);
};

export default handleRouteErrors({ POST });
