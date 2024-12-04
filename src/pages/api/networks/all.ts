import type { NextApiRequest } from 'next';

import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { getNetworks } from '@/server/services/networksListToCompare';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);
  return await getNetworks();
});
