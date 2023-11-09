import {
  closestNetwork,
  getConso,
  getNbLogement,
} from '@core/infrastructure/repository/addresseInformation';
import {
  getGestionnaires,
  getToRelanceDemand,
} from '@core/infrastructure/repository/manager';
import type { NextApiRequest, NextApiResponse } from 'next';
import base from 'src/db/airtable';
import { Airtable } from 'src/types/enum/Airtable';
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
    case Airtable.RELANCE: {
      const demand = await getToRelanceDemand(values.id);
      if (demand) {
        base(Airtable.UTILISATEURS).update(demand.id, {
          'Commentaire relance': values.comment,
        });
      }
      break;
    }
    case Airtable.UTILISATEURS: {
      base(Airtable.UTILISATEURS).create(
        [{ fields: values }],
        { typecast: true },
        async (error, records) => {
          creationCallBack(res)(error, records);

          if (!error && records && records[0]) {
            const [conso, nbLogement, network] = await Promise.all([
              getConso(values.Latitude, values.Longitude),
              getNbLogement(values.Latitude, values.Longitude),
              closestNetwork(values.Latitude, values.Longitude),
            ]);

            const gestionnaires = await getGestionnaires(
              values,
              network ? network['Identifiant reseau'] : ''
            );

            const toRelance =
              network &&
              network.distance < 200 &&
              values['Type de chauffage'] === 'Collectif';

            await base(Airtable.UTILISATEURS).update(
              records[0].getId(),
              {
                Gestionnaires: gestionnaires,
                Conso: conso ? conso.conso_nb : undefined,
                'ID Conso': conso ? conso.rownum : undefined,
                Logement: nbLogement ? nbLogement.nb_logements : undefined,
                'ID BNB': nbLogement ? nbLogement.fid : undefined,
                'Identifiant réseau': network
                  ? network['Identifiant reseau']
                  : undefined,
                'Nom réseau': network ? network.nom_reseau : undefined,
                'Relance à activer': toRelance,
              },
              { typecast: true }
            );
          }
        }
      );
      break;
    }
    case Airtable.CONTRIBUTION:
      base(Airtable.CONTRIBUTION).create(
        [{ fields: values }],
        creationCallBack(res)
      );
      break;
    case Airtable.NEWSLETTER:
      base(Airtable.NEWSLETTER).create(
        [{ fields: values }],
        creationCallBack(res)
      );
      break;
    case Airtable.CONTACT:
      base(Airtable.CONTACT).create(
        [{ fields: { ...values, Date: new Date() } }],
        creationCallBack(res)
      );
      break;

    default:
      res.status(400).send({ message: 'Type not recognized' });
      break;
  }
};
