import { getExport } from '@core/infrastructure/repository/addresseInformation';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';

const bulkEligibilitygibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<
    | { id: string; progress: number; result?: any[]; error?: boolean }
    | ErrorResponse
  >
) => {
  const id = req.query.id as string;

  const existingValue = await db('eligibility_tests').where('id', id).first();
  if (req.method === 'GET') {
    if (existingValue) {
      return res.status(200).json({
        id: existingValue.id,
        error: existingValue.in_error,
        progress: existingValue.progress / existingValue.addresses_count,
        result: JSON.parse(existingValue.result),
      });
    }
    return res.status(200).json({
      id,
      progress: 0,
    });
  } else if (req.method === 'POST') {
    if (existingValue && existingValue.result) {
      return res.send(getExport(JSON.parse(existingValue.result)));
    } else {
      return res.send(existingValue.file);
    }
  }
  return res.status(501);
};

export default withCors(bulkEligibilitygibilityStatus);
