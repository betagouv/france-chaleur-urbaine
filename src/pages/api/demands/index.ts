import type { NextApiRequest } from 'next';

import { getDemands } from '@core/infrastructure/repository/manager';
import { handleRouteErrors, invalidPermissionsError } from '@helpers/server';

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
