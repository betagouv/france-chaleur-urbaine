import {
  closestNetwork,
  getConso,
  getDistanceToNetwork,
  getNbLogement,
} from '@core/infrastructure/repository/addresseInformation';
import {
  getGestionnaires,
  getToRelanceDemand,
} from '@core/infrastructure/repository/manager';
import { logger } from '@helpers/logger';
import { handleRouteErrors, requirePostMethod } from '@helpers/server';
import type { NextApiRequest } from 'next';
import base, { AirtableDB } from 'src/db/airtable';
import { BadRequestError } from 'src/services/errors';
import { Airtable } from 'src/types/enum/Airtable';
import { v4 as uuidv4 } from 'uuid';

export default handleRouteErrors(async function PostRecords(
  req: NextApiRequest
) {
  requirePostMethod(req);

  // networkId est présent si test depuis fiche réseau
  const { type, networkId, ...values } = req.body;
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
        await AirtableDB(Airtable.UTILISATEURS).update(demand.id, {
          'Commentaire relance': values.comment,
        });
      }
      return;
    }

    case Airtable.UTILISATEURS: {
      // bad airtable type
      const { id: demandId }: any = await base(Airtable.UTILISATEURS).create(
        values,
        {
          typecast: true,
        }
      );
      const [conso, nbLogement, network] = await Promise.all([
        getConso(values.Latitude, values.Longitude),
        getNbLogement(values.Latitude, values.Longitude),
        networkId
          ? getDistanceToNetwork(networkId, values.Latitude, values.Longitude)
          : closestNetwork(values.Latitude, values.Longitude),
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
        id: demandId,
        nbLogement,
        conso,
        network,
        gestionnaires,
      });

      await AirtableDB(Airtable.UTILISATEURS).update(
        demandId,
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
      return { id: demandId };
    }

    case Airtable.CONTRIBUTION: {
      // bad airtable type
      const { id }: any = await AirtableDB(Airtable.CONTRIBUTION).create(
        values
      );
      logger.info('create airtable record contribution', {
        id,
      });
      return;
    }

    case Airtable.NEWSLETTER: {
      // bad airtable type
      const { id }: any = await AirtableDB(Airtable.NEWSLETTER).create(values);
      logger.info('create airtable record newsletter', {
        id,
      });
      return;
    }

    case Airtable.CONTACT: {
      // bad airtable type
      const { id }: any = await AirtableDB(Airtable.CONTACT).create({
        ...values,
        Date: new Date(),
      });
      logger.info('create airtable record contact', {
        id,
      });
      return;
    }

    default:
      throw new BadRequestError('Type not recognized');
  }
});
