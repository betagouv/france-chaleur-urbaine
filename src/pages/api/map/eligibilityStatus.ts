import { getElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';

const eligibilityStatus = async (
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
    const result = await getElibilityStatus(Number(lat), Number(lon), city);
    return res.status(200).json(result);
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
