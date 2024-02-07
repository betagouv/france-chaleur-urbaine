import z from 'zod';
import { getEligilityStatus } from '@core/infrastructure/repository/addresseInformation';
import type { NextApiRequest } from 'next';
import { withCors } from 'src/services/api/cors';
import { handleRouteErrors, requireGetMethod } from '@helpers/server';

const EligibilityValidation = z.object({
  lat: z.number(),
  lon: z.number(),
});

export default withCors(
  handleRouteErrors(async (req: NextApiRequest) => {
    requireGetMethod(req);
    const { lat, lon } = EligibilityValidation.parse({
      lat: Number(req.query.lat as string),
      lon: Number(req.query.lon as string),
    });

    const result = await getEligilityStatus(lat, lon);
    return {
      isEligible: result.isEligible,
      distance: result.distance,
      inPDP: result.inZDP,
      isBasedOnIris: result.isBasedOnIris,
      futurNetwork: result.futurNetwork,
      id: result.futurNetwork,
      gestionnaire: result.gestionnaire,
      rateENRR: result.tauxENRR,
      rateCO2: result.co2,
    };
  })
);
