import { type NextApiRequest } from 'next';

import { handleRouteErrors } from '@/server/helpers/server';
import { register } from '@/server/services/auth';
import { registrationSchema } from '@/validation/user';

const POST = async (req: NextApiRequest) => {
  const userData = await registrationSchema.parseAsync(req.body);

  return await register(userData);
};

export default handleRouteErrors({ POST });
