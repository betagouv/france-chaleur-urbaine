import type { NextApiRequest } from 'next';

import { getNetworks } from '@core/infrastructure/repository/networksListToCompare';
import { handleRouteErrors, invalidPermissionsError } from '@helpers/server';

export default handleRouteErrors(async (req: NextApiRequest) => {
  if (req.method === 'GET') {
    return await getNetworks();
  }

  throw invalidPermissionsError;
});
