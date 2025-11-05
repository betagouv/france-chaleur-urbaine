import type { NextApiRequest } from 'next';
import { v4 as uuidv4 } from 'uuid';
import * as demandsService from '@/modules/demands/server/demands-service';
import { createEvent } from '@/modules/events/server/service';
import { AirtableDB } from '@/server/db/airtable';
import { sendEmailTemplate } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod } from '@/server/helpers/server';
import { getConsommationGazAdresse, getNbLogement } from '@/server/services/addresseInformation';
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
      ids: [{ id: uuidv4() }],
      type,
      values,
    };
  }

  switch (type) {
    case Airtable.RELANCE: {
      const demand = await getToRelanceDemand(values.id);
      if (demand) {
        await demandsService.update(demand.id, {
          'Commentaire relance': values.comment,
        });
      }
      return;
    }

    case Airtable.DEMANDES: {
      const { id: demandId } = await demandsService.create({
        ...values,
        'Affecté à': defaultEmptyStringValue,
        'Distance au réseau': defaultEmptyNumberValue,
        Gestionnaires: [defaultEmptyStringValue],
        'Identifiant réseau': defaultEmptyStringValue,
        'Nom réseau': defaultEmptyStringValue,
      });
      const [conso, nbLogement] = await Promise.all([
        getConsommationGazAdresse(values.Latitude, values.Longitude),
        values.Logement ? values.Logement : getNbLogement(values.Latitude, values.Longitude),
      ]);

      logger.info('create eligibility demand', {
        conso,
        id: demandId,
        nbLogement,
      });

      await demandsService.update(demandId, {
        Conso: conso ? conso.conso_nb : undefined,
        'ID BNB': nbLogement ? `${nbLogement.id}` : undefined,
        Logement: nbLogement ? nbLogement.nb_logements : undefined,
      });

      await Promise.all([
        createEvent({
          context_id: demandId,
          context_type: 'demand',
          data: values,
          type: 'demand_created',
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
