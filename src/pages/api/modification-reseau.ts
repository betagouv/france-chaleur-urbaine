import { readFile } from 'node:fs/promises';

import formidable from 'formidable';
import { z } from 'zod';

import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { serverConfig } from '@/server/config';
import { AirtableDB, uploadAttachment } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';
import { parseValue } from '@/utils/form-utils';

export const config = {
  api: {
    bodyParser: false, // disable because formidable handles all the parsing
  },
};

// multipart form data may contain one field multiple times so we get the first element
const zModificationReseau = {
  idReseau: z.preprocess((val: any) => val[0], z.string()),
  type: z.preprocess((val: any) => val[0], z.enum(['collectivite', 'exploitant'])),
  nom: z.preprocess((val: any) => val[0], z.string()),
  prenom: z.preprocess((val: any) => val[0], z.string()),
  structure: z.preprocess((val: any) => val[0], z.string()),
  fonction: z.preprocess((val: any) => val[0], z.string()),
  email: z.preprocess(
    (val: any) => val[0],
    z.email().refine((email) => !serverConfig.email.notAllowed.includes(email), {
      error: serverConfig.email.notAllowedMessage,
    })
  ),
  reseauClasse: z.preprocess((val: any) => parseValue(val[0]), z.boolean()),
  maitreOuvrage: z.preprocess((val: any) => val[0], z.string()),
  gestionnaire: z.preprocess((val: any) => val[0], z.string()),
  siteInternet: z.preprocess((val: any) => {
    if (val[0]) {
      const link: string = String(val[0]).trim();
      return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
    }
    return val[0];
  }, z.string().optional()),
  informationsComplementaires: z.preprocess((val: any) => val[0], z.string().max(serverConfig.networkInfoFieldMaxCharacters)),
  fichiers: z.optional(
    z.array(
      // formidable.File
      z.object({
        filepath: z.string(),
        mimetype: z.literal('application/pdf'),
        originalFilename: z.string(),
      })
    )
  ),
};

export type ModificationReseau = z.infer<z.ZodObject<typeof zModificationReseau>>;

const rateLimiter = createNextApiRateLimiter();

export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await rateLimiter(req, res);

  const form = formidable({
    maxFiles: 3,
    maxFileSize: 5 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
  });

  const [fields, files] = await form.parse(req);

  const { fichiers, ...formValues } = await validateObjectSchema({ ...fields, fichiers: files.fichiers }, zModificationReseau);

  const record = await AirtableDB('FCU - Modifications réseau').create(
    {
      ...formValues,
      fichiers: [],
      createdAt: new Date().toISOString(),
    },
    {
      typecast: true,
    }
  );

  // 2nd step to upload attachments directly instead of using a temporary URL
  await Promise.all(
    (files.fichiers ?? []).map(async (fichier, index) => {
      await uploadAttachment(record.id, 'fichiers', {
        contentType: fichier.mimetype ?? 'text/plain',
        filename: fichier.originalFilename ?? `Fichier ${index + 1}`,
        file: (await readFile(fichier.filepath)).toString('base64'),
      });
    })
  );

  logger.info('create ModificationReseau', {
    id: record.id,
  });
});
