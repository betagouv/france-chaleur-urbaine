import type { NextApiRequest } from 'next';

import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { listNetworks } from '@/server/services/network';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);
  return await listNetworks();
});
