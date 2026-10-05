import { extname } from 'node:path';

import { type AllowedFileExtension, allowedFileExtensions, allowedFileTypes } from '../constants';

const PDF_SIGNATURE = Buffer.from('%PDF-');
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const SQLITE_SIGNATURE = Buffer.from('SQLite format 3\0');
const SHAPE_SIGNATURE = Buffer.from([0x00, 0x00, 0x27, 0x0a]); // file code 9994, big endian
// version byte of the dBase family (dBase III/IV/5/7, FoxPro, Visual FoxPro), first byte of every .dbf
const DBF_VERSION_BYTES = new Set([0x02, 0x03, 0x04, 0x05, 0x30, 0x31, 0x32, 0x43, 0x63, 0x7b, 0x83, 0x8b, 0x8e, 0xcb, 0xe5, 0xf5, 0xfb]);
const TEXT_PROBE_LENGTH = 8 * 1024;

export type DetectedFileType = { contentType: string; extension: AllowedFileExtension };

const isAllowedExtension = (extension: string): extension is AllowedFileExtension =>
  (allowedFileExtensions as string[]).includes(extension);

const startsWith = (content: Buffer, signature: Buffer) =>
  content.length >= signature.length && content.subarray(0, signature.length).equals(signature);

const looksLikeText = (content: Buffer) => content.length > 0 && !content.subarray(0, TEXT_PROBE_LENGTH).includes(0);

// only the head of the file is available: a JSON object starts with `{`, the full parsing happens when the file is used
const looksLikeJsonObject = (head: Buffer) =>
  looksLikeText(head) && head.toString('utf8', 0, TEXT_PROBE_LENGTH).trimStart().startsWith('{');

const contentChecks: Record<(typeof allowedFileTypes)[AllowedFileExtension]['check'], (content: Buffer) => boolean> = {
  dbf: (content) => content.length > 32 && DBF_VERSION_BYTES.has(content[0]),
  json: looksLikeJsonObject,
  pdf: (content) => startsWith(content, PDF_SIGNATURE),
  shape: (content) => startsWith(content, SHAPE_SIGNATURE),
  sqlite: (content) => startsWith(content, SQLITE_SIGNATURE),
  text: looksLikeText,
  xml: (content) => looksLikeText(content) && content.toString('utf8', 0, TEXT_PROBE_LENGTH).trimStart().startsWith('<'),
  zip: (content) => startsWith(content, ZIP_SIGNATURE),
};

/** Number of leading bytes needed by `detectFileType`. */
export const FILE_TYPE_PROBE_LENGTH = TEXT_PROBE_LENGTH;

/**
 * Detects the type of an uploaded file from its extension and its first bytes (`head` = at most the first
 * `FILE_TYPE_PROBE_LENGTH` bytes). Returns `null` when the extension is not accepted or when the bytes do not match
 * what the extension announces, so a renamed executable is rejected whatever MIME type the browser declared.
 */
export const detectFileType = (filename: string, head: Buffer): DetectedFileType | null => {
  const extension = extname(filename).toLowerCase();
  if (!isAllowedExtension(extension)) {
    return null;
  }
  const fileType = allowedFileTypes[extension];
  return contentChecks[fileType.check](head) ? { contentType: fileType.contentType, extension } : null;
};
