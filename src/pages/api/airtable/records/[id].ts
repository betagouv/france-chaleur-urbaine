import {
  handleRouteErrors,
  requirePutMethod,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest } from 'next';
import base from 'src/db/airtable';
import { Airtable } from 'src/types/enum/Airtable';
import { z } from 'zod';

const zAirtableId = z.string().length(17); // e.g. rec6nCFUO7Nzj6M9n

export default handleRouteErrors(async (req: NextApiRequest) => {
  requirePutMethod(req);

  const { id } = await validateObjectSchema(req.query, {
    id: zAirtableId,
  });
  // would be best with the type in the URL
  const { type, ...values } = await validateObjectSchema(req.body, {
    type: z.enum([Airtable.UTILISATEURS]),
    sondage: z.array(z.string().max(300)), // may contain an unknown string as the last value if Other is included
  });

  switch (type) {
    case Airtable.UTILISATEURS: {
      await base(Airtable.UTILISATEURS).update(
        id,
        { Sondage: values.sondage },
        { typecast: true }
      );
    }
  }
});
