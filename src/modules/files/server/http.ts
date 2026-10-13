import type { NextApiResponse } from 'next';

import { sanitizeFilename } from '@/utils/strings';

import { type FileScanStatus, fileScanStatusLabels } from '../constants';

type ServableFile = { content: Buffer | null; content_type: string; filename: string; scan_status: FileScanStatus; size: number };

/**
 * Sends a stored file, or the reason why it cannot be sent: `409` while the antivirus scan is pending, `403` when the
 * file is infected or its scan failed, `404` when the content was purged. `attachment` for untrusted uploads (admin
 * review), `inline` for documents already validated and published.
 */
export const sendStoredFile = (res: NextApiResponse, file: ServableFile, disposition: 'attachment' | 'inline') => {
  if (!file.content) {
    return res.status(404).json({ message: 'Fichier introuvable' });
  }
  if (file.scan_status === 'pending') {
    return res.status(409).json({ message: fileScanStatusLabels.pending });
  }
  if (file.scan_status !== 'clean' && file.scan_status !== 'skipped') {
    return res.status(403).json({ message: `Fichier non téléchargeable : ${fileScanStatusLabels[file.scan_status].toLowerCase()}` });
  }
  res.writeHead(200, {
    'Content-Disposition': `${disposition}; filename="${sanitizeFilename(file.filename)}"`,
    'Content-Length': file.size,
    'Content-Type': file.content_type,
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(file.content);
};
