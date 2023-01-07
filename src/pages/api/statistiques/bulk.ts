import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await db('eligibility_tests')
      .select()
      .whereNull('in_error')
      .orderBy('created_at', 'asc');

    let nbTotal = 0;
    let nbEligible = 0;

    return res.status(200).json(
      data.reduce((acc, value) => {
        const date: Date = new Date(value.created_at);
        const key = date.toISOString().split('T')[0];

        nbTotal += value.addresses_count - value.error_count;
        nbEligible += value.eligibile_count;

        return !key
          ? acc
          : {
              ...acc,
              [key]: {
                date: key,
                nbTotal,
                nbEligible,
                nbUneligible: nbTotal - nbEligible,
              },
            };
      }, {})
    );
  } catch (err) {
    res.status(500).json({
      error: 'failed to load data',
    });
  }
};
