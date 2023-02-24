import type { NextApiRequest, NextApiResponse } from 'next';
import base from 'src/db/airtable';
import { Airtable } from 'src/types/enum/Airtable';

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
  if (req.method !== 'PUT') {
    return res.status(405).send({ message: 'Only PUT requests allowed' });
  }

  const { id } = req.query;
  const { type, ...values } = req.body;
  if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION === 'true') {
    console.log('Updating', id, 'to', type, values);
    return res.status(200).json({
      type: type,
      values: values,
    });
  }

  switch (type) {
    case Airtable.UTILISATEURS: {
      base(Airtable.UTILISATEURS).update(
        id as string,
        { Sondage: values.sondage },
        { typecast: true },
        async (error, records) => {
          creationCallBack(res)(error, records);
        }
      );
      break;
    }

    default:
      res.status(400).send({ message: 'Type not recognized' });
      break;
  }
};
