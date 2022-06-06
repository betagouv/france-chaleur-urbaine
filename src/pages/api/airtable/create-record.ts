import Airtable from 'airtable';
import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_KEY_API = process.env.AIRTABLE_KEY_API;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const base = new Airtable({ apiKey: AIRTABLE_KEY_API }).base(
  AIRTABLE_BASE || ''
);

export default async (req: NextApiRequest, res: NextApiResponse<any>) => {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  if (req?.body) {
    base('FCU - Contacts Utilisateurs').create(
      [{ fields: req?.body }],
      function (err: any, records: any) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: err });
          return;
        }
        const jsonResponse = {
          ids: records,
        };
        res.status(200).json(jsonResponse);
      }
    );
  }
};
