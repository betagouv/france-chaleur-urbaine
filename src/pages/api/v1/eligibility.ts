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
    distance: result.distance,
    futurNetwork: result.futurNetwork,
    gestionnaire: result.gestionnaire,
    id: result.id,
    inPDP: result.inPDP,
    isEligible: result.isEligible,
    name: result.name,
    rateCO2: result.co2,
    rateENRR: result.tauxENRR,
  };
};

export default withCors(handleRouteErrors({ GET }));
