import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';
import { ErrorResponse } from 'src/types/ErrorResponse';

const bulkEligibilitygibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<
    | { id: string; progress: number; result?: string; error?: boolean }
    | ErrorResponse
  >
) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }

  const id = req.query.id as string;

  const existingValue = await db('eligibility_tests').where('id', id).first();

  if (existingValue) {
    return res.status(200).json({
      id: existingValue.id,
      error: existingValue.in_error,
      progress: existingValue.progress / existingValue.addresses_count,
      result: existingValue.result,
    });
  }
  return res.status(200).json({
    id,
    progress: 0,
  });
};

export default withCors(bulkEligibilitygibilityStatus);
