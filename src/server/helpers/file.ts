import fs from 'node:fs';
import axios, { type AxiosRequestHeaders } from 'axios';

import { logger } from '@/server/helpers/logger';

type DownloadFileOptions = {
  url: string;
  fileName?: string;
  headers?: AxiosRequestHeaders;
};

export async function downloadFile({ url, fileName, headers }: DownloadFileOptions): Promise<string> {
  const filePath = fileName || `temp_${Date.now()}.geojson`;
  logger.debug(`📥 Téléchargement de ${url} dans ${filePath}`);

  try {
    const response = await axios.get(url, { headers, responseType: 'stream' });
    const writeStream = fs.createWriteStream(filePath);

    response.data.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    logger.debug(`✅ Fichier téléchargé: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`❌ Erreur lors du téléchargement de ${url}:`, error);
    throw error;
  }
}

export async function downloadFiles(urls: string[] | DownloadFileOptions[]): Promise<string[]> {
  const localPaths: string[] = [];

  for (const urlOrObject of urls) {
    const url = typeof urlOrObject === 'string' ? urlOrObject : urlOrObject.url;
    const fileName = typeof urlOrObject === 'string' ? undefined : urlOrObject.fileName;
    const headers = typeof urlOrObject === 'string' ? undefined : urlOrObject.headers;

    const filePath = await downloadFile({ fileName, headers, url });
    localPaths.push(filePath);
  }

  return localPaths;
}
