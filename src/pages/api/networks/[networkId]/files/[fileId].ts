import { Readable } from 'stream';

import { z } from 'zod';

import { AirtableDB } from '@/server/db/airtable';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';
import { type NetworkAttachment } from '@/types/Summary/Network';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default handleRouteErrors(async (req, res) => {
  requireGetMethod(req);
  const { networkId, fileId } = await validateObjectSchema(req.query, {
    networkId: z.string(),
    fileId: z.string(),
  });

  const [network] = await AirtableDB('FCU - Réseaux de chaleur')
    .select({
      fields: ['fichiers'],
      filterByFormula: `{Identifiant reseau} = '${networkId}'`,
    })
    .all();
  if (!network) {
    throw new Error('not found');
  }
  const fichier = (network.fields.fichiers! as NetworkAttachment[]).find((fichier) => fichier.id === fileId);
  if (!fichier) {
    throw new Error('not found');
  }
  const downloadRes = await fetch(fichier.url);
  if (!downloadRes.ok) {
    throw new Error(`invalid status code: ${downloadRes.status}`);
  }
  if (!downloadRes.body) {
    throw new Error(`no body`);
  }
  res.writeHead(200, {
    'Content-Type': fichier.type,
    'Content-Length': fichier.size,
    'Content-Disposition': `inline; filename="${fichier.filename}"`,
  });

  // stream the file to the client and convert web stream (fetch body) to node stream (used by http Response)
  const contentStream = Readable.fromWeb(downloadRes.body as any);
  await new Promise((resolve) => {
    contentStream.pipe(res);
    contentStream.on('end', resolve);
  });
});
