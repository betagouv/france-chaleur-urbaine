import type { NextApiRequest } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { zAirtableAdemeHelp } from '@/modules/chaleur-renouvelable/constants';
import { serverConfig } from '@/server/config';
import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';
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
      ids: [{ id: uuidv4() }],
      type,
      values,
    };
  }

  switch (type) {
    case Airtable.NEWSLETTER: {
      const email = values.Email?.toLowerCase();
      if (email && serverConfig.email.notAllowed.includes(email)) {
        throw new BadRequestError(serverConfig.email.notAllowedMessage);
      }
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

    case Airtable.CONTACT_CHALEUR_RENOUVELABLE: {
      const { ...parsedValues } = await validateObjectSchema({ ...values }, zAirtableAdemeHelp);

      const { id }: any = await AirtableDB(Airtable.CONTACT_CHALEUR_RENOUVELABLE).create(parsedValues);
      logger.info('create airtable record contact chaleur renouvelable', {
        id,
      });
      return;
    }

    default:
      throw new BadRequestError('Type not recognized');
  }
});
