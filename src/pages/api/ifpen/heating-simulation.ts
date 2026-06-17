import type { NextApiRequest } from 'next';

import { zIfpenHeatingSimulationInput } from '@/modules/ifpen/constants';
import { getIfpenHeatingSimulation } from '@/modules/ifpen/server/heating-simulation-service';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const handler = async (req: NextApiRequest) => {
  requirePostMethod(req);

  return getIfpenHeatingSimulation(zIfpenHeatingSimulationInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
