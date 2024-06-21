import { getEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import {
  handleRouteErrors,
  requireGetMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest } from 'next';
import { withCors } from 'src/services/api/cors';
import z from 'zod';

export default withCors(
  handleRouteErrors(async (req: NextApiRequest) => {
    requireGetMethod(req);

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
  })
);
