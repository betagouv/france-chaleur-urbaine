import type { NextApiRequest } from 'next';
import z from 'zod';

import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { withCors } from '@/services/api/cors';

const GET = async (req: NextApiRequest) => {
  const { lat, lon } = await validateObjectSchema(req.query, {
    lat: z.coerce.number(),
    lon: z.coerce.number(),
  });

  const result = await getEligilityStatus(lat, lon);
  return {
    isEligible: result.isEligible,
    distance: result.distance,
    inPDP: result.inPDP,
    isBasedOnIris: result.isBasedOnIris,
    futurNetwork: result.futurNetwork,
    id: result.id,
    name: result.name,
    gestionnaire: result.gestionnaire,
    rateENRR: result.tauxENRR,
    rateCO2: result.co2,
  };
};

export default withCors(handleRouteErrors({ GET }));
