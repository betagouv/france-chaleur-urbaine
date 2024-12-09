import type { NextApiRequest } from 'next';

import { handleRouteErrors, invalidPermissionsError } from '@/server/helpers/server';
import { getDemands } from '@/server/services/manager';

export default handleRouteErrors(
  async (req: NextApiRequest) => {
    if (req.method === 'GET') {
      return await getDemands(req.user);
    }

    throw invalidPermissionsError;
  },
  {
    requireAuthentication: true,
  }
);
