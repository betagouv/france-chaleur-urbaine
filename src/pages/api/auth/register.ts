import type { NextApiRequest, NextApiResponse } from 'next';

import { register } from '@/modules/auth/server/service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { registrationSchema } from '@/modules/users/constants';
import { handleRouteErrors } from '@/server/helpers/server';

// Anti-abuse: a legitimate person creates a handful of accounts at most, bots create hundreds
const registerRateLimiter = createNextApiRateLimiter({
  limit: 10,
  path: 'auth-register',
  windowMs: 60 * 60 * 1000, // 1 hour
});

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  await registerRateLimiter(req, res);
  const userData = await registrationSchema.parseAsync(req.body);

  return await register(userData);
};

export default handleRouteErrors({ POST });
