import { createReadStream } from 'node:fs';

import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({
  module: 'upload',
});

const BASE_URL = 'https://transfer.totakoko.com';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on 5xx errors or network errors
      if (response.ok || response.status < 500) {
        return response;
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * 2 ** attempt;
        logger.warn('fetch failed, retrying', {
          attempt: attempt + 1,
          delay,
          status: response.status,
          url,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        return response;
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * 2 ** attempt;
        logger.warn('fetch error, retrying', {
          attempt: attempt + 1,
          delay,
          error: error instanceof Error ? error.message : String(error),
          url,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

export async function uploadTempFile(filepath: string, filename: string): Promise<string> {
  const fileStream = createReadStream(filepath);

  const response = await fetchWithRetry(`${BASE_URL}/${filename}`, {
    body: fileStream as any,
    // @ts-expect-error - Node.js fetch supports duplex for streaming
    duplex: 'half',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Max-Days': '1',
      'Max-Downloads': '1',
    },
    method: 'PUT',
  });

  const downloadURL = await response.text();

  logger.info('upload temp file', {
    downloadURL,
    status: response.status,
  });

  if (response.status !== 200) {
    throw new Error(`upload failed: status ${response.status}`);
  }

  return downloadURL;
}
