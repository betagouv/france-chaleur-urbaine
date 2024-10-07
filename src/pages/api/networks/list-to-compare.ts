import type { NextApiRequest } from 'next';

import { getNetworks } from '@core/infrastructure/repository/networksListToCompare';
import { handleRouteErrors, requireGetMethod } from '@helpers/server';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);
  return await getNetworks();
});
