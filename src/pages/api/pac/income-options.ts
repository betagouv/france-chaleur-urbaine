import type { NextApiRequest } from 'next';

import { zIncomeOptionsInput } from '@/modules/pac/constants';
import { getIncomeOptions } from '@/modules/pac/server/simulation-service';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const handler = async (req: NextApiRequest) => {
  requirePostMethod(req);

  return getIncomeOptions(zIncomeOptionsInput.parse(req.body));
};

export default withCors(handleRouteErrors(handler));
