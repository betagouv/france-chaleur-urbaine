import { createConnection } from 'node:net';

import { serverConfig } from '@/server/config';

export type FileScanResult = { status: 'clean' } | { status: 'infected'; details: string } | { status: 'error'; details: string };

const CLAMD_CHUNK_SIZE = 64 * 1024;
const CLAMD_TIMEOUT_MS = 120_000;

export const isFileScannerEnabled = () => serverConfig.FILE_SCANNER !== 'none';

/**
 * Interprets the reply of the clamd INSTREAM command: `stream: OK`, `stream: <signature> FOUND`,
 * or an `ERROR` line (size limit exceeded, engine failure).
 */
export const parseClamdResponse = (response: string): FileScanResult => {
  const line = response.replaceAll('\0', '').trim();
  if (line.endsWith(' OK')) {
    return { status: 'clean' };
  }
  if (line.endsWith(' FOUND')) {
    return { details: line.replace(/^stream: /, '').replace(/ FOUND$/, ''), status: 'infected' };
  }
  return { details: line || 'empty response', status: 'error' };
};

/**
 * Streams the content to the clamd daemon (INSTREAM protocol: 4-byte big-endian length prefixed chunks, zero-length chunk to end).
 * Network failures are reported as `error`, never thrown: the caller decides what an unscanned file means.
 */
export const scanFileContent = (content: Buffer): Promise<FileScanResult> =>
  new Promise((resolve) => {
    const socket = createConnection({ host: serverConfig.CLAMAV_HOST, port: serverConfig.CLAMAV_PORT });
    const responseChunks: Buffer[] = [];
    const finish = (result: FileScanResult) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(CLAMD_TIMEOUT_MS, () => finish({ details: 'clamd timeout', status: 'error' }));
    socket.on('error', (error) => finish({ details: error.message, status: 'error' }));
    socket.on('data', (chunk) => responseChunks.push(Buffer.from(chunk)));
    socket.on('close', () => resolve(parseClamdResponse(Buffer.concat(responseChunks).toString('utf8'))));
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      for (let offset = 0; offset < content.length; offset += CLAMD_CHUNK_SIZE) {
        const chunk = content.subarray(offset, offset + CLAMD_CHUNK_SIZE);
        const lengthPrefix = Buffer.alloc(4);
        lengthPrefix.writeUInt32BE(chunk.length, 0);
        socket.write(Buffer.concat([lengthPrefix, chunk]));
      }
      socket.write(Buffer.alloc(4));
    });
  });
