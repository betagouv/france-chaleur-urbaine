import type { NextApiRequest } from 'next';

import { getFranceRenovSpaceByCityCode } from '@/modules/chaleur-renouvelable/server/france-renov-spaces';
import { zFranceRenovSpaceInput } from '@/modules/pac/constants';
import { handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

const handler = async (req: NextApiRequest) => {
  requirePostMethod(req);

  return getFranceRenovSpaceByCityCode(zFranceRenovSpaceInput.parse(req.body).cityCode);
};

export default withCors(handleRouteErrors(handler));
