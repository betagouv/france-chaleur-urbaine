// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFromMatomo } from './matomoHelper';

const API_DEBUG_MODE = process.env.API_DEBUG_MODE;

type Data = Record<string, unknown>;

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  currentDate.setDate(1);
  try {
    const result = await fetchFromMatomo(
      {
        method: 'VisitsSummary.get',
        period: 'month',
      },
      Array(12)
        .fill(null)
        .map((v, i) => {
          const baseDate = new Date(currentDate.toDateString());
          baseDate.setMonth(baseDate.getMonth() - i);
          const date = `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${baseDate
            .getDate()
            .toString()
            .padStart(2, '0')}`;
          return {
            date,
          };
        }),
      true
    );
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({
      error: 'failed to load data',
      ...(API_DEBUG_MODE ? { debug: err } : {}),
    });
  }
};
