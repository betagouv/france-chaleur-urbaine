import { z } from 'zod';

import { sendStoredFile } from '@/modules/files/server/http';
import { getNetworkDocumentForDownload } from '@/modules/reseaux/server/documents';
import { handleRouteErrors, invalidRouteError, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';

export const config = {
  api: {
    responseLimit: false,
  },
};

/** Public download of a document published on a network page (validated by an admin), served from the database. */
export default handleRouteErrors(async (req, res) => {
  requireGetMethod(req);
  const { networkId, fileId } = await validateObjectSchema(req.query, {
    fileId: z.uuid(),
    networkId: z.string().regex(/^[A-Za-z0-9_-]{1,20}$/),
  });

  const file = await getNetworkDocumentForDownload(networkId, fileId);
  if (!file) {
    throw invalidRouteError;
  }
  // PDF open in the browser, archives download
  sendStoredFile(res, file, file.content_type === 'application/pdf' ? 'inline' : 'attachment');
});
