import { getCityElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { CityNetwork } from 'src/types/HeatNetworksResponse';

const cityNetwork = async (
  req: NextApiRequest,
  res: NextApiResponse<CityNetwork | ErrorResponse>
) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { city } = req.query as Record<string, string>;

    if (!city) {
      res.status(400).json({
        message: 'Parameter city is required',
        code: 'Bad Arguments',
      });
      return;
    }
    const result = await getCityElibilityStatus(city);
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

export default withCors(cityNetwork);
