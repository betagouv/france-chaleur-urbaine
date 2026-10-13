import { z } from 'zod';

import { sendStoredFile } from '@/modules/files/server/http';
import { getFileForDownload } from '@/modules/files/server/service';
import { handleRouteErrors, invalidRouteError, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';

export const config = {
  api: {
    responseLimit: false,
  },
};

/**
 * Download of an uploaded file, admin only: files of a change request are untrusted until an admin has reviewed them,
 * so they are always sent as an attachment. Documents published on a network page have their own public route.
 */
export default handleRouteErrors(
  async (req, res) => {
    requireGetMethod(req);
    const { fileId } = await validateObjectSchema(req.query, { fileId: z.uuid() });

    const file = await getFileForDownload(fileId);
    if (!file) {
      throw invalidRouteError;
    }
    sendStoredFile(res, file, 'attachment');
  },
  { requireAuthentication: ['admin'] }
);
