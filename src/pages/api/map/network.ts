//import { getCityElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import { getNetwork } from '@core/infrastructure/repository/network';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';
//import { CityNetwork } from 'src/types/HeatNetworksResponse';
import { Network } from 'src/types/Summary/Network';

const eligibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<Network | ErrorResponse>
) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { identifiant } = req.query as Record<string, string>;

    if (!identifiant) {
      res.status(400).json({
        message: 'Parameter identifiant is required',
        code: 'Bad Arguments',
      });
      return;
    }

    const result = await getNetwork(identifiant);
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
