import getDataSummary from '@core/infrastructure/repository/dataSummary';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { Summary } from 'src/types/Summary';

export default async function getEligibilityStatusgibilityStatus(
  req: NextApiRequest,
  res: NextApiResponse<Summary | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { swLng, swLat, neLng, neLat } = req.query as Record<string, string>;

    if (!swLng || !swLat || !neLng || !neLat) {
      res.status(400).json({
        message: 'Parameters swLng, swLat, neLng and neLat are required',
        code: 'Bad Arguments',
      });
      return;
    }

    const data = await getDataSummary(+swLng, +swLat, +neLng, +neLat);

    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
