import type { NextApiRequest } from 'next';

import { zHeatingSimulationInput } from '@/modules/pac/constants';
import { getHeatingSimulation } from '@/modules/pac/server/simulation-service';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const handler = async (req: NextApiRequest) => {
  requirePostMethod(req);

  return getHeatingSimulation(zHeatingSimulationInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
