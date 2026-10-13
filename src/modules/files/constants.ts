import { z } from 'zod';

export const fileScanStatuses = ['pending', 'clean', 'infected', 'error', 'skipped'] as const;
export type FileScanStatus = (typeof fileScanStatuses)[number];

export const fileScanStatusLabels: Record<FileScanStatus, string> = {
  clean: 'Analysé, sain',
  error: "Erreur d'analyse",
  infected: 'Infecté',
  pending: 'Analyse antivirus en cours',
  skipped: 'Non analysé (antivirus désactivé)',
};

/** Limits of one upload request (formidable), shared by the upload route and the public forms. */
export const fileUploadLimits = {
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 10,
  maxTotalFileSize: 100 * 1024 * 1024,
};

/** Uncompressed size cap of an uploaded archive (zip bomb protection). */
export const zipMaxUncompressedSize = 500 * 1024 * 1024;

/**
 * Accepted upload types: extension → content type stored in database, and the byte-level check applied at upload
 * (the browser-declared type is never trusted). `group` drives which roles a file can play in a change request.
 */
export const allowedFileTypes = {
  '.cpg': { check: 'text', contentType: 'text/plain', group: 'geo' },
  '.dbf': { check: 'dbf', contentType: 'application/x-dbf', group: 'geo' },
  '.geojson': { check: 'json', contentType: 'application/geo+json', group: 'geo' },
  '.gpkg': { check: 'sqlite', contentType: 'application/geopackage+sqlite3', group: 'geo' },
  '.json': { check: 'json', contentType: 'application/json', group: 'geo' },
  '.kml': { check: 'xml', contentType: 'application/vnd.google-earth.kml+xml', group: 'geo' },
  '.kmz': { check: 'zip', contentType: 'application/vnd.google-earth.kmz', group: 'geo' },
  '.pdf': { check: 'pdf', contentType: 'application/pdf', group: 'pdf' },
  '.prj': { check: 'text', contentType: 'text/plain', group: 'geo' },
  '.qmd': { check: 'xml', contentType: 'application/xml', group: 'geo' },
  '.shp': { check: 'shape', contentType: 'application/x-esri-shape', group: 'geo' },
  '.shx': { check: 'shape', contentType: 'application/x-esri-shape-index', group: 'geo' },
  // the FEDENE library, uploaded by an admin on the « Enquête FEDENE » page: refused for anyone else by the upload route
  '.xlsx': { check: 'zip', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', group: 'spreadsheet' },
  '.zip': { check: 'zip', contentType: 'application/zip', group: 'geo' },
} as const satisfies Record<string, { check: string; contentType: string; group: 'geo' | 'pdf' | 'spreadsheet' }>;

export type AllowedFileExtension = keyof typeof allowedFileTypes;
export type FileTypeGroup = (typeof allowedFileTypes)[AllowedFileExtension]['group'];
export type FileContentType = (typeof allowedFileTypes)[AllowedFileExtension]['contentType'];

export const allowedFileExtensions = Object.keys(allowedFileTypes) as AllowedFileExtension[];

/** Type groups only an admin may upload. */
export const adminOnlyFileTypeGroups: readonly FileTypeGroup[] = ['spreadsheet'];

/** Extensions a public form accepts (the admin-only types aside), listed in the error messages. */
export const publicFileExtensions = allowedFileExtensions.filter(
  (extension) => !adminOnlyFileTypeGroups.includes(allowedFileTypes[extension].group)
);

const fileTypeGroupByContentType = Object.fromEntries(
  Object.values(allowedFileTypes).map((fileType) => [fileType.contentType, fileType.group])
);

/** Type group of a stored file from its detected content type, `undefined` for an unknown type. */
export const getFileTypeGroup = (contentType: string): FileTypeGroup | undefined => fileTypeGroupByContentType[contentType];

/** Metadata of an uploaded file, as returned by the upload route and listed in the admin (never the content). */
export const zUploadedFile = z.object({
  contentType: z.string(),
  filename: z.string(),
  id: z.uuid(),
  scanStatus: z.enum(fileScanStatuses),
  size: z.number(),
});
export type UploadedFile = z.infer<typeof zUploadedFile>;
