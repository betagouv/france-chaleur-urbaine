import formidable from 'formidable';

import { fileUploadLimits } from '@/modules/files/constants';
import { discardTemporaryFiles, FileValidationError, prepareUploadedFile, storeUploadedFiles } from '@/modules/files/server/service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { logger } from '@/server/helpers/logger';
import { BadRequestError, handleRouteErrors, requirePostMethod } from '@/server/helpers/server';

export const config = {
  api: {
    bodyParser: false, // formidable streams the multipart body to temporary files
  },
};

// Public endpoint (files are uploaded before the form is submitted). A contribution sends up to two requests (trace +
// perimeter). With the per-request size cap (`fileUploadLimits`), this bounds the bytea volume an IP can store per
// window; orphan files are purged after `uploadedFileOrphanRetentionHours`.
const uploadRateLimiter = createNextApiRateLimiter({ limit: 20, path: '/api/files/upload', windowMs: 10 * 60 * 1000 });

/**
 * Stores the files of a public form (field `files`) and returns their ids, to be referenced by the form submission.
 * Files are streamed to disk (sha256 computed on the fly), validated on their first bytes, then stored one at a time.
 * Files never attached to anything are purged by the `purgeOrphanFiles` cron.
 */
export default handleRouteErrors(async (req, res) => {
  requirePostMethod(req);
  await uploadRateLimiter(req, res);

  // only the `files` field is read: anything else is not even written to disk
  const [, files] = await formidable({ ...fileUploadLimits, filter: ({ name }) => name === 'files', hashAlgorithm: 'sha256' }).parse(req);
  const receivedFiles = files.files ?? [];
  if (receivedFiles.length === 0) {
    throw new BadRequestError('Aucun fichier reçu');
  }

  try {
    // validate the whole batch before storing anything: a rejected file fails the request without leaving orphans
    const preparedFiles = await Promise.all(receivedFiles.map(prepareUploadedFile));
    return { files: await storeUploadedFiles(preparedFiles, logger) };
  } catch (error) {
    await discardTemporaryFiles(receivedFiles);
    throw error instanceof FileValidationError ? new BadRequestError(error.message) : error;
  }
});
