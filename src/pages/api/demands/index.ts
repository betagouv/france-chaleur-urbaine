import type { NextApiRequest } from 'next';

import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { getDemands } from '@/server/services/manager';

// disable the warning for this route as the result is big > 4MB
export const config = {
  api: {
    responseLimit: false,
  },
};

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    requireGetMethod(req);
    return await getDemands(req.user);
  },
  {
    requireAuthentication: ['gestionnaire', 'demo'],
  }
);
