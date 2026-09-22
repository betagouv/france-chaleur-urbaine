import { open } from 'node:fs/promises';

const PDF_SIGNATURE = Buffer.from('%PDF-');

/**
 * Checks the magic bytes of an uploaded file instead of trusting the MIME type declared by the browser.
 * A PDF always starts with `%PDF-`.
 */
export const hasPdfSignature = async (filepath: string): Promise<boolean> => {
  const fileHandle = await open(filepath, 'r');
  try {
    const header = Buffer.alloc(PDF_SIGNATURE.length);
    const { bytesRead } = await fileHandle.read(header, 0, PDF_SIGNATURE.length, 0);
    return bytesRead === PDF_SIGNATURE.length && header.equals(PDF_SIGNATURE);
  } finally {
    await fileHandle.close();
  }
};
