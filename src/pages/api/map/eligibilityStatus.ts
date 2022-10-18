import { computeDistance } from '@core/infrastructure/repository/addresseInformation';
import networkByIris from '@core/infrastructure/repository/network_by_iris.json';
import inZDP from '@core/infrastructure/repository/zdp';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';
import { axiosHttpClient } from 'src/services/http';
import { AddressPyrisResponse } from 'src/types/AddressPyrisResponse';
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
    const addressPyrisPromise = axiosHttpClient.get<AddressPyrisResponse>(
      `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${lat}&lon=${lon}`
    );

    const distance = Math.round(await computeDistance(coords.lat, coords.lon));
    if (distance !== null && Number(distance) < 1000) {
      return res.status(200).json({
        isEligible: Number(distance) <= THRESHOLD,
        distance,
        inZDP: await zdpPromise,
        isBasedOnIris: false,
      });
    }

    const addressPyris = await addressPyrisPromise;
    const irisCode = Number(addressPyris.complete_code);
    const foundNetwork = networkByIris.some(
      (network) => Number(network.code) === irisCode
    );
    return res.status(200).json({
      isEligible: foundNetwork,
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
