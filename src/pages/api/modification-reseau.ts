import formidable from 'formidable';
import { type NextApiRequest } from 'next';
import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { AirtableDB } from '@/server/db/airtable';
import { fileIOClient } from '@/server/helpers/fileio';
import { logger } from '@/server/helpers/logger';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';

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
  email: z.preprocess((val: any) => val[0], z.string().email()),
  reseauClasse: z.preprocess((val: any) => {
    switch (val[0]) {
      case 'false':
        return false;
      case 'true':
        return true;
      default:
        return val[0];
    }
  }, z.boolean()),
  maitreOuvrage: z.preprocess((val: any) => val[0], z.string()),
  gestionnaire: z.preprocess((val: any) => val[0], z.string()),
  siteInternet: z.preprocess((val: any) => {
    if (val[0]) {
      const link: string = String(val[0]).trim();
      return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
    }
    return val[0];
  }, z.string().optional()),
  informationsComplementaires: z.preprocess((val: any) => val[0], z.string().max(clientConfig.networkInfoFieldMaxCharacters)),
  fichiers: z.optional(
    z.array(
      z.object({
        filepath: z.string(),
        mimetype: z.literal('application/pdf'),
        originalFilename: z.string(),
      })
    )
  ),
};

export type ModificationReseau = z.infer<z.ZodObject<typeof zModificationReseau>>;

export default handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);

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
      fichiers: await Promise.all(
        (files.fichiers ?? []).map(async (fichier, index) => {
          const externalURL = await fileIOClient.uploadTempFile(fichier.filepath, fichier.originalFilename ?? `Fichier ${index + 1}.pdf`);
          return {
            filename: fichier.originalFilename ?? `Fichier ${index + 1}`,
            url: externalURL,
          } as any; // bypass wrong typing
        })
      ),
      createdAt: new Date().toISOString(),
    },
    {
      typecast: true,
    }
  );
  logger.info('create ModificationReseau', {
    id: record.id,
  });
});
