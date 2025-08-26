import type { NextApiRequest } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { createEvent } from '@/modules/events/server/service';
import base, { AirtableDB } from '@/server/db/airtable';
import { sendEmailTemplate } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { getConso, getNbLogement } from '@/server/services/addresseInformation';
import { getToRelanceDemand } from '@/server/services/manager';
import { Airtable } from '@/types/enum/Airtable';
import { defaultEmptyNumberValue, defaultEmptyStringValue } from '@/utils/airtable';

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
        await AirtableDB(Airtable.DEMANDES).update(demand.id, {
          'Commentaire relance': values.comment,
        });
      }
      return;
    }

    case Airtable.DEMANDES: {
      // bad airtable type
      const { id: demandId }: any = await base(Airtable.DEMANDES).create(
        {
          ...values,
          Gestionnaires: [defaultEmptyStringValue],
          'Affecté à': defaultEmptyStringValue,
          'Distance au réseau': defaultEmptyNumberValue,
          'Identifiant réseau': defaultEmptyStringValue,
          'Nom réseau': defaultEmptyStringValue,
        },
        {
          typecast: true,
        }
      );
      const [conso, nbLogement] = await Promise.all([
        getConso(values.Latitude, values.Longitude),
        values.Logement ? values.Logement : getNbLogement(values.Latitude, values.Longitude),
      ]);

      logger.info('create eligibility demand', {
        id: demandId,
        nbLogement,
        conso,
      });

      await AirtableDB(Airtable.DEMANDES).update(
        demandId,
        {
          Conso: conso ? conso.conso_nb : undefined,
          'ID Conso': conso ? conso.rownum : undefined,
          Logement: nbLogement ? nbLogement.nb_logements : undefined,
          'ID BNB': nbLogement ? `${nbLogement.id}` : undefined,
        },
        { typecast: true }
      );

      await Promise.all([
        createEvent({
          type: 'demand_created',
          context_type: 'demand',
          context_id: demandId,
          data: values,
        }),
        sendEmailTemplate(
          'creation-demande',
          { email: values.Mail },
          { demand: { ...values, 'Distance au réseau': values['Distance au réseau'] ?? 9999 } } // si > 1000m la distance est null, or le template veut une distance
        ),
      ]);

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
