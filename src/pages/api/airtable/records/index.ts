import {
  closestNetwork,
  getConso,
  getNbLogement,
} from '@core/infrastructure/repository/addresseInformation';
import {
  getGestionnaires,
  getToRelanceDemand,
} from '@core/infrastructure/repository/manager';
import { logger } from '@helpers/logger';
import { handleRouteErrors, requirePostMethod } from '@helpers/server';
import type { NextApiRequest } from 'next';
import base from 'src/db/airtable';
import { BadRequestError } from 'src/services/errors';
import { Airtable } from 'src/types/enum/Airtable';
import { v4 as uuidv4 } from 'uuid';

export default handleRouteErrors(async function PostRecords(
  req: NextApiRequest
) {
  requirePostMethod(req);

  const { type, ...values } = req.body;
  if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION === 'true') {
    logger.info('create demand', {
      type,
      values,
    });
    return {
      type: type,
      values: values,
      ids: [{ id: uuidv4() }],
    };
  }

  switch (type) {
    case Airtable.RELANCE: {
      const demand = await getToRelanceDemand(values.id);
      if (demand) {
        const records = await base(Airtable.UTILISATEURS).update(demand.id, {
          'Commentaire relance': values.comment,
        });
        return { ids: records };
      }
      break;
    }
    case Airtable.UTILISATEURS: {
      const records = await base(Airtable.UTILISATEURS).create(values, {
        typecast: true,
      });
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

      logger.info('create eligibility demand', {
        id: records[0].getId(),
        nbLogement,
        conso,
        network,
        gestionnaires,
      });

      await base(Airtable.UTILISATEURS).update(
        records[0].getId(),
        {
          Gestionnaires: gestionnaires,
          Conso: conso ? conso.conso_nb : undefined,
          'ID Conso': conso ? conso.rownum : undefined,
          Logement: nbLogement ? nbLogement.nb_logements : undefined,
          'ID BNB': nbLogement ? `${nbLogement.id}` : undefined,
          'Identifiant réseau': network
            ? network['Identifiant reseau']
            : undefined,
          'Nom réseau': network ? network.nom_reseau : undefined,
          'Relance à activer': toRelance,
        },
        { typecast: true }
      );
      return { ids: records };
    }
    case Airtable.CONTRIBUTION: {
      const records = await base(Airtable.CONTRIBUTION).create(values);
      return { ids: records };
    }
    case Airtable.NEWSLETTER: {
      const records = await base(Airtable.NEWSLETTER).create(values);
      return { ids: records };
    }
    case Airtable.CONTACT: {
      const records = await base(Airtable.CONTACT).create({
        ...values,
        Date: new Date(),
      });
      return { ids: records };
    }
    default:
      throw new BadRequestError('Type not recognized');
  }
});
