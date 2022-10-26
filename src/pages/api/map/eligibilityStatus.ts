import {
  computeDistance,
  isOnAnIRISNetwork,
} from '@core/infrastructure/repository/address';
import inZDP from '@core/infrastructure/repository/zdp';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';

const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);
const eligibilityStatusgibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<HeatNetworksResponse | ErrorResponse>
) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { lat, lon, city } = req.query as Record<string, string>;

    if (!lat || !lon || !city) {
      res.status(400).json({
        message: 'Parameters city, lat and lon are required',
        code: 'Bad Arguments',
      });
      return;
    }
    const coords = { lat: Number(lat), lon: Number(lon) };
    const zdpPromise = inZDP(coords.lat, coords.lon);
    const irisNetwork = isOnAnIRISNetwork(coords.lat, coords.lon);

    const distance = Math.round(await computeDistance(coords.lat, coords.lon));
    if (distance !== null && Number(distance) < 1000) {
      return res.status(200).json({
        isEligible: Number(distance) <= THRESHOLD,
        distance,
        inZDP: await zdpPromise,
        isBasedOnIris: false,
      });
    }

    return res.status(200).json({
      isEligible: await irisNetwork,
      distance: null,
      inZDP: await zdpPromise,
      isBasedOnIris: true,
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

export default withCors(eligibilityStatusgibilityStatus);
