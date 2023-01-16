import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await db('eligibility_tests')
      .select()
      .whereNull('in_error')
      .orderBy('created_at', 'asc');

    const defaultMonthValue = {
      nbTotal: 0,
      nbEligible: 0,
      nbUneligible: 0,
    };

    return res.status(200).json(
      data.reduce((acc, value) => {
        const date: Date = new Date(value.created_at);
        const keys = date.toISOString().split('T')[0].split('-');
        const key = `${keys[0]}-${keys[1]}`;

        const current = {
          ...(acc[key] || defaultMonthValue),
        };

        current.nbTotal += value.addresses_count - value.error_count;
        current.nbEligible += value.eligibile_count;
        current.nbUneligible = current.nbTotal - current.nbEligible;

        return !key
          ? acc
          : {
              ...acc,
              [key]: current,
            };
      }, {})
    );
  } catch (err) {
    res.status(500).json({
      error: 'failed to load data',
    });
  }
};
