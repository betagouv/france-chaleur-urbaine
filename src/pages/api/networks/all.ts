import type { NextApiRequest } from 'next';

import { listNetworks } from '@/modules/reseaux/server/service';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);
  return await listNetworks();
});
