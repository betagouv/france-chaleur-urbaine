import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { getFilesMetadata, purgeFileContents } from '@/modules/files/server/service';
import { kdb } from '@/server/db/kysely';

import { MAX_NETWORK_DOCUMENTS, type NetworkEntityType } from '../constants';

/** Network entities that publish documents on their public page. */
export type DocumentedNetworkType = Extract<NetworkEntityType, 'reseau_de_chaleur' | 'reseau_de_froid'>;

/** Sub-query listing the documents of a network row (id, filename, size, type), for the public page and the admin. */
export const networkDocumentsJsonAgg = (table: 'reseaux_de_chaleur' | 'reseaux_de_froid', networkType: DocumentedNetworkType) =>
  jsonArrayFrom(
    kdb
      .selectFrom('network_files as network_file')
      .innerJoin('files as file', 'file.id', 'network_file.file_id')
      .select(['file.id', 'file.filename', 'file.size', 'file.content_type as type'])
      // correlated with the outer network row
      .where('network_file.network_id', '=', sql.ref<number>(`${table}.id_fcu`))
      .where('network_file.network_type', '=', networkType)
      .orderBy('network_file.position')
      .orderBy('network_file.created_at')
  );

/** Documents published on a network page (admin editor). */
export const listNetworkDocuments = async (networkType: DocumentedNetworkType, networkId: number) =>
  await kdb
    .selectFrom('network_files')
    .innerJoin('files', 'files.id', 'network_files.file_id')
    .select(['files.id', 'files.filename', 'files.size', 'files.content_type as type'])
    .where('network_files.network_type', '=', networkType)
    .where('network_files.network_id', '=', networkId)
    .orderBy('network_files.position')
    .orderBy('network_files.created_at')
    .execute();

/** Content types a network page can publish: PDF, or a zip archive of documents (schémas directeurs en plusieurs parties). */
export const networkDocumentContentTypes = ['application/pdf', 'application/zip'] as const;

/**
 * Publishes files on a network page. The files must be PDF or zip, scanned (or scanning disabled), not purged, and either
 * unused or attached to a change request (acceptance flow). At most `MAX_NETWORK_DOCUMENTS` documents per network.
 */
export const addNetworkDocuments = async (networkType: DocumentedNetworkType, networkId: number, fileIds: string[]) => {
  if (fileIds.length === 0) {
    return;
  }
  const [, existing] = await Promise.all([
    assertNetworkDocumentsPublishable(fileIds),
    kdb.selectFrom('network_files').select('file_id').where('network_type', '=', networkType).where('network_id', '=', networkId).execute(),
  ]);
  const newFileIds = fileIds.filter((fileId) => !existing.some((link) => link.file_id === fileId));
  if (existing.length + newFileIds.length > MAX_NETWORK_DOCUMENTS) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Un réseau ne peut pas avoir plus de ${MAX_NETWORK_DOCUMENTS} documents` });
  }
  if (newFileIds.length === 0) {
    return;
  }
  await kdb
    .insertInto('network_files')
    .values(
      newFileIds.map((fileId, index) => ({
        file_id: fileId,
        network_id: networkId,
        network_type: networkType,
        position: existing.length + index,
      }))
    )
    .execute();
};

/** `BAD_REQUEST` unless every file exists, is scanned (or scanning is disabled), not purged, and is a PDF or a zip archive. */
export const assertNetworkDocumentsPublishable = async (fileIds: string[]) => {
  if (fileIds.length === 0) {
    return;
  }
  const files = await getFilesMetadata(fileIds);
  const isPublishable = (file: (typeof files)[number]) =>
    (networkDocumentContentTypes as readonly string[]).includes(file.content_type) &&
    file.purged_at === null &&
    (file.scan_status === 'clean' || file.scan_status === 'skipped');
  if (files.length !== fileIds.length || !files.every(isPublishable)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un document est introuvable, non analysé ou n’est ni un PDF ni une archive zip' });
  }
};

/** Unpublishes a document; its content is dropped when no other network publishes it. */
export const removeNetworkDocument = async (networkType: DocumentedNetworkType, networkId: number, fileId: string) => {
  const deleted = await kdb
    .deleteFrom('network_files')
    .where('network_type', '=', networkType)
    .where('network_id', '=', networkId)
    .where('file_id', '=', fileId)
    .executeTakeFirst();
  if (Number(deleted.numDeletedRows) === 0) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Document introuvable' });
  }
  const otherLinks = await kdb.selectFrom('network_files').select('file_id').where('file_id', '=', fileId).executeTakeFirst();
  if (!otherLinks) {
    await purgeFileContents([fileId]);
  }
};

/** A document of a heat or cold network identified by its SNCU id, for the public download route. */
export const getNetworkDocumentForDownload = async (identifiantReseau: string, fileId: string) =>
  await kdb
    .selectFrom('network_files')
    .innerJoin('files', 'files.id', 'network_files.file_id')
    .select(['files.id', 'files.filename', 'files.content_type', 'files.size', 'files.scan_status', 'files.content'])
    .where('network_files.file_id', '=', fileId)
    .where((eb) =>
      eb.or([
        eb.and([
          eb('network_files.network_type', '=', 'reseau_de_chaleur'),
          eb(
            'network_files.network_id',
            'in',
            eb.selectFrom('reseaux_de_chaleur').select('id_fcu').where('Identifiant reseau', '=', identifiantReseau)
          ),
        ]),
        eb.and([
          eb('network_files.network_type', '=', 'reseau_de_froid'),
          eb(
            'network_files.network_id',
            'in',
            eb.selectFrom('reseaux_de_froid').select('id_fcu').where('Identifiant reseau', '=', identifiantReseau)
          ),
        ]),
      ])
    )
    .executeTakeFirst();
