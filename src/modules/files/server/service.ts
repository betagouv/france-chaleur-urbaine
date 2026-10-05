import { open, readFile, unlink } from 'node:fs/promises';
import { extname } from 'node:path';

import { TRPCError } from '@trpc/server';
import type { Logger } from 'winston';

import { businessRules } from '@/modules/app/business-rules';
import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { formatFileSize } from '@/utils/strings';

import {
  allowedFileExtensions,
  allowedFileTypes,
  type FileScanStatus,
  fileUploadLimits,
  type UploadedFile,
  zipMaxUncompressedSize,
} from '../constants';
import { type DetectedFileType, detectFileType, FILE_TYPE_PROBE_LENGTH } from './file-type';
import { type FileScanResult, isFileScannerEnabled } from './scanner';
import { listZipEntries, type ZipReader } from './zip-inspection';

/** Rejection of an uploaded file, with a message meant for the person who uploaded it. */
export class FileValidationError extends Error {}

/** File received by formidable: already streamed to a temporary path, with its sha256 computed on the fly. */
export type TemporaryUploadedFile = { filepath: string; hash?: string | null; originalFilename: string | null; size: number };

export type PreparedFile = DetectedFileType & { filename: string; filepath: string; sha256: string; size: number };

const zipEntryAllowedExtensions = allowedFileExtensions.filter((extension) => extension !== '.zip');

/**
 * Validates a file received by the upload route without loading it in memory: accepted type (first bytes), size and,
 * for archives, entry list and uncompressed size read from the central directory. Nothing is written to the database
 * so a batch can be validated entirely before being stored.
 */
export const prepareUploadedFile = async (file: TemporaryUploadedFile): Promise<PreparedFile> => {
  const filename = (file.originalFilename ?? '').split(/[\\/]/).pop()?.trim() ?? '';
  if (!filename) {
    throw new FileValidationError('Un fichier sans nom a été reçu.');
  }
  if (file.size > fileUploadLimits.maxFileSize) {
    throw new FileValidationError(
      `Le fichier « ${filename} » dépasse la taille maximale autorisée (${formatFileSize(fileUploadLimits.maxFileSize)}).`
    );
  }
  if (!file.hash) {
    throw new Error('missing file hash: formidable must be configured with hashAlgorithm sha256');
  }

  const fileHandle = await open(file.filepath, 'r');
  try {
    const head = Buffer.alloc(Math.min(FILE_TYPE_PROBE_LENGTH, file.size));
    await fileHandle.read(head, 0, head.length, 0);
    const detected = detectFileType(filename, head);
    if (!detected) {
      throw new FileValidationError(
        `Le fichier « ${filename} » n'est pas d'un type accepté ou son contenu ne correspond pas à son extension. Extensions acceptées : ${allowedFileExtensions.join(', ')}.`
      );
    }
    if (allowedFileTypes[detected.extension].check === 'zip') {
      const reader: ZipReader = {
        read: async (offset, length) => {
          const chunk = Buffer.alloc(length);
          await fileHandle.read(chunk, 0, length, offset);
          return chunk;
        },
        size: file.size,
      };
      await inspectArchive(filename, reader, detected.extension === '.zip');
    }
    return { ...detected, filename, filepath: file.filepath, sha256: file.hash, size: file.size };
  } finally {
    await fileHandle.close();
  }
};

/**
 * Stores validated files one at a time (a single file is in memory at once: bytea cannot be streamed) and removes the
 * temporary files. Each file starts as `pending` with a scan job when the antivirus is configured, or as `skipped` otherwise.
 */
export const storeUploadedFiles = async (files: PreparedFile[], logger: Logger): Promise<UploadedFile[]> => {
  const scanStatus: FileScanStatus = isFileScannerEnabled() ? 'pending' : 'skipped';
  const stored: UploadedFile[] = [];
  // sequential on purpose: bounds the memory to one file
  for (const file of files) {
    const content = await readFile(file.filepath);
    // the file and its scan job together: a pending file without a job would never become downloadable
    const row = await kdb.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto('files')
        .values({
          content,
          content_type: file.contentType,
          filename: file.filename,
          scan_status: scanStatus,
          sha256: file.sha256,
          size: file.size,
        })
        .returning(['id', 'filename', 'content_type', 'size', 'scan_status'])
        .executeTakeFirstOrThrow();
      if (scanStatus === 'pending') {
        await trx
          .insertInto('jobs')
          .values({ data: { fileId: inserted.id }, status: 'pending', type: 'scan_file' })
          .execute();
      }
      return inserted;
    });
    await unlink(file.filepath);
    stored.push({ contentType: row.content_type, filename: row.filename, id: row.id, scanStatus: row.scan_status, size: row.size });
  }
  logger.info('files stored', { count: stored.length, scanStatus, totalSize: files.reduce((total, file) => total + file.size, 0) });
  return stored;
};

/** Removes the temporary files of a batch that will not be stored (validation failure). */
export const discardTemporaryFiles = async (files: TemporaryUploadedFile[]) => {
  await Promise.all(files.map((file) => unlink(file.filepath).catch(() => undefined)));
};

/** Renames a stored file for display and download; the extension must stay (the content type was detected from the content). */
export const renameStoredFile = async (fileId: string, filename: string) => {
  const file = await kdb.selectFrom('files').select('filename').where('id', '=', fileId).executeTakeFirstOrThrow();
  const extension = extname(file.filename).toLowerCase();
  const cleaned = filename.trim().replace(/[\\/]/g, '-');
  if (cleaned.length < 1 || cleaned.length > 200 || extname(cleaned).toLowerCase() !== extension) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Le nom doit garder l'extension ${extension} et faire moins de 200 caractères` });
  }
  await kdb.updateTable('files').set({ filename: cleaned }).where('id', '=', fileId).execute();
  return cleaned;
};

/** Metadata of files (never the content), e.g. to check the files attached to a request being created. */
export const getFilesMetadata = async (fileIds: string[]) =>
  fileIds.length === 0
    ? []
    : await kdb
        .selectFrom('files')
        .leftJoin('network_change_request_files', 'network_change_request_files.file_id', 'files.id')
        .select([
          'files.id',
          'files.filename',
          'files.content_type',
          'files.size',
          'files.scan_status',
          'files.purged_at',
          'network_change_request_files.request_id',
        ])
        .where('files.id', 'in', fileIds)
        .execute();

export const getFileForDownload = async (fileId: string) =>
  await kdb
    .selectFrom('files')
    .select(['id', 'filename', 'content_type', 'size', 'scan_status', 'content', 'purged_at'])
    .where('id', '=', fileId)
    .executeTakeFirst();

export const markFileScanResult = async (fileId: string, result: FileScanResult | { status: 'skipped' }) => {
  await kdb
    .updateTable('files')
    .set({
      scan_details: 'details' in result ? result.details : null,
      scan_status: result.status,
      scanned_at: new Date(),
    })
    .where('id', '=', fileId)
    .execute();
};

/** Drops the content of files that are no longer needed; the rows stay so references and history remain intact. */
export const purgeFileContents = async (fileIds: string[]) => {
  if (fileIds.length === 0) {
    return;
  }
  await kdb
    .updateTable('files')
    .set({ content: null, purged_at: new Date() })
    .where('id', 'in', fileIds)
    .where('purged_at', 'is', null)
    .execute();
};

/** Deletes files uploaded by an abandoned form (attached neither to a request nor to a network) once the retention delay is over. */
export const purgeOrphanFiles = async () => {
  const cutoff = new Date(Date.now() - businessRules.uploadedFileOrphanRetentionHours.value * 3600 * 1000);
  const result = await kdb
    .deleteFrom('files')
    .where('created_at', '<', cutoff)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom('network_change_request_files').select('file_id').whereRef('network_change_request_files.file_id', '=', 'files.id')
        )
      )
    )
    .where((eb) => eb.not(eb.exists(eb.selectFrom('network_files').select('file_id').whereRef('network_files.file_id', '=', 'files.id'))))
    .executeTakeFirst();
  parentLogger.info('orphan files purged', { count: Number(result.numDeletedRows) });
};

/**
 * Rejects an archive whose entries are not of an accepted type (plain `.zip` only: office and KMZ archives have their own
 * internal layout) or whose uncompressed size is suspicious (zip bomb).
 */
const inspectArchive = async (filename: string, reader: ZipReader, checkEntryTypes: boolean) => {
  const entries = await listZipEntries(reader).catch(() => {
    throw new FileValidationError(`L'archive « ${filename} » est invalide ou non prise en charge.`);
  });
  const uncompressedSize = entries.reduce((total, entry) => total + entry.uncompressedSize, 0);
  if (uncompressedSize > zipMaxUncompressedSize) {
    throw new FileValidationError(`L'archive « ${filename} » est trop volumineuse une fois décompressée.`);
  }
  if (!checkEntryTypes) {
    return;
  }
  const rejectedEntry = entries.find(
    (entry) => !entry.name.endsWith('/') && !zipEntryAllowedExtensions.some((extension) => entry.name.toLowerCase().endsWith(extension))
  );
  if (rejectedEntry) {
    throw new FileValidationError(
      `L'archive « ${filename} » contient un fichier non accepté (« ${rejectedEntry.name} »). Extensions acceptées : ${zipEntryAllowedExtensions.join(', ')}.`
    );
  }
};
