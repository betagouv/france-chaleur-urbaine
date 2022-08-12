import type { NextApiRequest, NextApiResponse } from 'next';
import base from 'src/db/airtable';

const creationCallBack =
  (res: NextApiResponse<any>) => (err: any, records: any) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err });
      return;
    }
    const jsonResponse = {
      ids: records,
    };
    res.status(200).json(jsonResponse);
  };

export default async (req: NextApiRequest, res: NextApiResponse<any>) => {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  if (req?.body) {
    const { type, ...values } = req.body;
    switch (type) {
      case 'FCU - Utilisateurs':
        base('FCU - Utilisateurs').create(
          [{ fields: values }],
          creationCallBack(res)
        );
        break;
      case 'FCU - Contribution':
        base('FCU - Contribution').create(
          [{ fields: values }],
          creationCallBack(res)
        );
        break;
      default:
        res.status(400).send({ message: 'Type not recognized' });
        break;
    }
  }
};
