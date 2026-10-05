# files module

Storage of files uploaded by public forms, in the database (`files` table, `content` bytea), with type detection, antivirus status and content purge. No S3: the volume is small and the content is dropped as soon as it is no longer needed.

## Structure

- `constants.ts` — `allowedFileTypes` (extension → detected content type, byte-level check, type group `pdf` / `geo`), upload limits, scan statuses and labels, `zUploadedFile`.
- `server/file-type.ts` — `detectFileType(filename, head)`: extension must be allowed and the first bytes (`FILE_TYPE_PROBE_LENGTH`) must match it (PDF, zip, SQLite, shapefile, dBase, text/JSON/XML probes). The browser MIME type is never used.
- `server/zip-inspection.ts` — `listZipEntries(reader)` reads the central directory by random access (buffer or file descriptor) without inflating nor loading the archive: entry names (a plain `.zip` may only contain accepted types) and uncompressed size cap (zip bomb).
- `server/scanner.ts` — `FILE_SCANNER=none|clamav`; clamd INSTREAM client, `parseClamdResponse`. Errors are returned, never thrown.
- `server/service.ts` — `prepareUploadedFile` (validation on the temporary file: head bytes, archive directory, sha256 computed by formidable while streaming) + `storeUploadedFiles` (one file in memory at a time: `bytea` cannot be streamed; `pending` + `scan_file` job when the scanner is enabled, `skipped` otherwise), `getFileForDownload`, `getFilesMetadata`, `markFileScanResult`, `purgeFileContents`, `purgeOrphanFiles`.
- `server/jobs.ts` — `scan_file` job handler (registered in `jobs.config.ts`).

## Routes (REST, binary — the tRPC exception)

- `POST /api/files/upload` (public, 20 requests per 10 minutes and IP; `fileUploadLimits` caps one request, multipart field `files`): formidable streams each file to disk with its sha256, the whole batch is validated, then stored file by file; returns `{ files: UploadedFile[] }`. The ids are then referenced by the form submission (`networkChangeRequests.create`). Kept in REST on purpose: tRPC's multipart support buffers the request in memory and its octet-stream input would need a dedicated handler plus out-of-band metadata.
- `GET /api/files/[fileId]` (admin): served as an attachment with `nosniff`, only when `scan_status` is `clean` or `skipped`; `409` while `pending`, `403` when `infected` / `error`, `404` when purged.

## Lifecycle

- A file never attached to a request is deleted by the `purgeOrphanFiles` cron after `businessRules.uploadedFileOrphanRetentionHours`.
- The content is kept after processing (downloadable from the request) and purged by the retention rule (row kept); published PDF documents are linked to the network (`network_files`) and keep their content.
- Retention: the `processed_network_change_requests` rule purges the remaining contents of the files of reviewed requests (except published documents).
