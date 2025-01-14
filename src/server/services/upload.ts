import { createReadStream } from 'node:fs';

import axios from 'axios';
import axiosRetry from 'axios-retry';

import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({
  module: 'upload',
});

// don't patch the global client
const httpClient = axios.create({ baseURL: 'https://transfer.totakoko.com' });
axiosRetry(httpClient);

export async function uploadTempFile(filepath: string, filename: string): Promise<string> {
  const response = await httpClient.put(`/${filename}`, createReadStream(filepath), {
    headers: {
      'Max-Downloads': '1',
      'Max-Days': '1',
      'Content-Type': 'application/octet-stream',
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  logger.info('upload temp file', {
    status: response.status,
    downloadURL: response.data,
  });
  if (response.status !== 200) {
    throw new Error(`upload failed: status ${response.status}`);
  }
  const downloadURL = response.data;
  return downloadURL;
}
