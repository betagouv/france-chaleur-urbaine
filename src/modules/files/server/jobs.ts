import type { Selectable } from 'kysely';
import type { Logger } from 'winston';

import { type Jobs, kdb } from '@/server/db/kysely';

import { isFileScannerEnabled, scanFileContent } from './scanner';
import { markFileScanResult } from './service';

export type ScanFileJob = Omit<Selectable<Jobs>, 'data'> & {
  type: 'scan_file';
  data: {
    fileId: string;
  };
};

/**
 * Antivirus scan of an uploaded file. A scan failure leaves the file in `error` (not downloadable) and fails the job
 * so it shows up in the admin task list.
 */
export async function processScanFileJob(job: ScanFileJob, logger: Logger) {
  const file = await kdb.selectFrom('files').select(['id', 'content', 'scan_status']).where('id', '=', job.data.fileId).executeTakeFirst();
  if (!file) {
    logger.warn('file not found, nothing to scan', { fileId: job.data.fileId });
    return { skipped: 'missing' };
  }
  if (!file.content) {
    logger.info('file content already purged, nothing to scan', { fileId: file.id });
    return { skipped: 'purged' };
  }
  if (!isFileScannerEnabled()) {
    await markFileScanResult(file.id, { status: 'skipped' });
    return { skipped: 'scanner disabled' };
  }

  const result = await scanFileContent(file.content);
  await markFileScanResult(file.id, result);
  logger.info('file scanned', { fileId: file.id, status: result.status });
  if (result.status === 'error') {
    throw new Error(`file scan failed: ${result.details}`);
  }
  return result;
}
