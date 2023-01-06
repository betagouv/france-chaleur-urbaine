import {
  getConso,
  getNbLogement,
} from '@core/infrastructure/repository/addresseInformation';
import { getGestionnaires } from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import base from 'src/db/airtable';
import { v4 as uuidv4 } from 'uuid';

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
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { type, ...values } = req.body;
  if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION === 'true') {
    console.log('Sending to', type, values);
    return res.status(200).json({
      type: type,
      values: values,
      ids: [{ id: uuidv4() }],
    });
  }

  switch (type) {
    case 'FCU - Utilisateurs': {
      base('FCU - Utilisateurs').create(
        [{ fields: values }],
        { typecast: true },
        async (error, records) => {
          creationCallBack(res)(error, records);

          if (!error && records && records[0]) {
            const gestionnaires = getGestionnaires(values);
            const [conso, nbLogement] = await Promise.all([
              getConso(values.Latitude, values.Longitude),
              getNbLogement(values.Latitude, values.Longitude),
            ]);

            await base('FCU - Utilisateurs').update(
              records[0].getId(),
              {
                Gestionnaires: gestionnaires,
                Conso: conso ? conso.conso_nb : undefined,
                'ID Conso': conso ? conso.rownum : undefined,
                Logement: nbLogement ? nbLogement.nb_logements : undefined,
                'ID BNB': nbLogement ? nbLogement.fid : undefined,
              },
              { typecast: true }
            );
          }
        }
      );
      break;
    }
    case 'FCU - Contribution':
      base('FCU - Contribution').create(
        [{ fields: values }],
        creationCallBack(res)
      );
      break;
    case 'FCU - Newsletter':
      base('FCU - Newsletter').create(
        [{ fields: values }],
        creationCallBack(res)
      );
      break;
    case 'FCU - Indicateurs':
      base('FCU - Indicateurs').create(
        [{ fields: { ...values, Date: new Date() } }],
        creationCallBack(res)
      );
      break;

    default:
      res.status(400).send({ message: 'Type not recognized' });
      break;
  }
};
