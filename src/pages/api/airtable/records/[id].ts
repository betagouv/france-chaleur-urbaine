import type { NextApiRequest } from 'next';
import { z } from 'zod';
import * as demandsService from '@/modules/demands/server/demands-service';
import { handleRouteErrors, requirePutMethod, validateObjectSchema } from '@/server/helpers/server';
import { Airtable } from '@/types/enum/Airtable';
import { zAirtableRecordId } from '@/utils/validation';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requirePutMethod(req);

  const { id } = await validateObjectSchema(req.query, {
    id: zAirtableRecordId,
  });
  // would be best with the type in the URL
  const { type, ...values } = await validateObjectSchema(req.body, {
    sondage: z.array(z.string().max(300)), // may contain an unknown string as the last value if Other is included
    type: z.enum([Airtable.DEMANDES]),
  });

  switch (type) {
    case Airtable.DEMANDES: {
      await demandsService.update(id, { Sondage: values.sondage });
    }
  }
});
