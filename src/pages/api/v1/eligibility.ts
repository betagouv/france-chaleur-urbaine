import { getElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';

const eligibilityStatus = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { lat, lon } = req.query as Record<string, string>;

    if (!lat || !lon) {
      res.status(400).json({
        message: 'Parameters lat and lon are required',
        code: 'Bad Arguments',
      });
      return;
    }
    const result = await getElibilityStatus(Number(lat), Number(lon));
    return res.status(200).json({
      isEligible: result.isEligible,
      distance: result.distance,
      inPDP: result.inZDP,
      isBasedOnIris: result.isBasedOnIris,
      futurNetwork: result.futurNetwork,
      id: result.futurNetwork,
      gestionnaire: result.gestionnaire,
      rateENRR: result.tauxENRR,
      rateCO2: result.co2,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
};

export default withCors(eligibilityStatus);
