import type { NextApiRequest } from 'next';

import { zIfpenIncomeOptionsInput } from '@/modules/ifpen/constants';
import { getIfpenIncomeOptions } from '@/modules/ifpen/server/heating-simulation-service';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const handler = async (req: NextApiRequest) => {
  requirePostMethod(req);

  return getIfpenIncomeOptions(zIfpenIncomeOptionsInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
