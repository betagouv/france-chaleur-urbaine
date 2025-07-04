import type { NextApiRequest } from 'next';
import { v4 as uuidv4 } from 'uuid';

import base, { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { getConso, getNbLogement } from '@/server/services/addresseInformation';
import { getToRelanceDemand } from '@/server/services/manager';
import { Airtable } from '@/types/enum/Airtable';

export default handleRouteErrors(async function PostRecords(req: NextApiRequest) {
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
      const { id: demandId }: any = await base(Airtable.UTILISATEURS).create(values, {
        typecast: true,
      });
      const [conso, nbLogement] = await Promise.all([
        getConso(values.Latitude, values.Longitude),
        values.Logement ? values.Logement : getNbLogement(values.Latitude, values.Longitude),
      ]);

      logger.info('create eligibility demand', {
        id: demandId,
        nbLogement,
        conso,
      });

      await AirtableDB(Airtable.UTILISATEURS).update(
        demandId,
        {
          Gestionnaires: [],
          Conso: conso ? conso.conso_nb : undefined,
          'ID Conso': conso ? conso.rownum : undefined,
          Logement: nbLogement ? nbLogement.nb_logements : undefined,
          'ID BNB': nbLogement ? `${nbLogement.id}` : undefined,
        },
        { typecast: true }
      );
      return { id: demandId };
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

    case Airtable.COMMUNES_SANS_RESEAU: {
      const { id }: any = await AirtableDB(Airtable.COMMUNES_SANS_RESEAU).create(values);
      logger.info('create airtable record commune sans reseau', {
        id,
      });
      return;
    }

    default:
      throw new BadRequestError('Type not recognized');
  }
});
