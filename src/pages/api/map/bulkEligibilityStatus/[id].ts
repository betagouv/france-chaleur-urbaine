import type { NextApiRequest, NextApiResponse } from 'next';

import { kdb } from '@/server/db/kysely';
import { getExport } from '@/server/services/addresseInformation';
import { withCors } from '@/services/api/cors';

const bulkEligibilitygibilityStatus = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id as string;

  const existingValue = await kdb.selectFrom('eligibility_tests').selectAll().where('id', '=', id).executeTakeFirst();
  if (req.method === 'GET') {
    if (existingValue) {
      const progress =
        existingValue.addresses_count && existingValue.eligibile_count !== null && existingValue.error_count !== null
          ? (existingValue.eligibile_count + existingValue.error_count) / existingValue.addresses_count
          : 0;
      return res.status(200).json({
        error: existingValue.in_error ?? false,
        id: existingValue.id,
        progress,
        result: existingValue.result ? JSON.parse(existingValue.result) : undefined,
      });
    }
    return res.status(200).json({
      id,
      progress: 0,
    });
  } else if (req.method === 'POST') {
    if (!existingValue) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Not found' });
    }
    if (existingValue.result) {
      return res.status(200).send(getExport(JSON.parse(existingValue.result)));
    }
    return res.status(200).send(existingValue.file);
  }
  return res.status(501).json({ code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
};

export default withCors(bulkEligibilitygibilityStatus);
