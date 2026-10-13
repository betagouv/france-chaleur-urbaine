import { createHash } from 'node:crypto';

import type { Command } from '@commander-js/extra-typings';

import { detectFileType, FILE_TYPE_PROBE_LENGTH } from '@/modules/files/server/file-type';
import { bufferZipReader, listZipEntries } from '@/modules/files/server/zip-inspection';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';

import type { DocumentedNetworkType } from './documents';

const sources = [
  { airtable: Airtable.NETWORKS, networkType: 'reseau_de_chaleur' },
  { airtable: Airtable.COLD_NETWORKS, networkType: 'reseau_de_froid' },
] as const satisfies readonly { airtable: Airtable; networkType: DocumentedNetworkType }[];

type AirtableAttachment = { filename: string; id: string; size: number; type: string; url: string };

/**
 * One-off migration of the documents attached to the networks in Airtable (column « fichiers ») into the `files` table
 * and `network_files`. Idempotent: a document already published on the network with the same content is skipped.
 * The documents were validated by the team before publication, so they are stored with the scan status `skipped`.
 */
export const importAirtableNetworkDocuments = async ({ dryRun }: { dryRun: boolean }) => {
  const counts = { imported: 0, invalid: 0, skipped: 0 };
  for (const source of sources) {
    const records = await AirtableDB(source.airtable)
      .select({ fields: ['id_fcu', 'fichiers'] })
      .all();
    for (const record of records) {
      const idFcu = record.get('id_fcu') as number | undefined;
      const attachments = (record.get('fichiers') as AirtableAttachment[] | undefined) ?? [];
      if (!idFcu || attachments.length === 0) {
        continue;
      }
      const existing = await kdb
        .selectFrom('network_files')
        .innerJoin('files', 'files.id', 'network_files.file_id')
        .select('files.sha256')
        .where('network_files.network_type', '=', source.networkType)
        .where('network_files.network_id', '=', idFcu)
        .execute();
      for (const [index, attachment] of attachments.entries()) {
        // binary download of a signed Airtable URL: the JSON helpers of @/utils/network do not apply
        const response = await fetch(attachment.url);
        if (!response.ok) {
          throw new Error(`téléchargement impossible (${response.status}) : ${attachment.filename}`);
        }
        const content = Buffer.from(await response.arrayBuffer());
        const sha256 = createHash('sha256').update(content).digest('hex');
        const detected = detectFileType(attachment.filename, content.subarray(0, FILE_TYPE_PROBE_LENGTH));
        const rejection = detected ? await describeRejection(detected.contentType, content) : 'ni PDF ni archive zip';
        if (rejection) {
          logger.warn(`document ignoré (${rejection})`, { filename: attachment.filename, idFcu, networkType: source.networkType });
          counts.invalid++;
          continue;
        }
        if (existing.some((file) => file.sha256 === sha256)) {
          counts.skipped++;
          continue;
        }
        // the same archive is attached to every network of a territory: stored once, linked to each network
        const sharedFile = await kdb
          .selectFrom('files')
          .select('id')
          .where('sha256', '=', sha256)
          .where('purged_at', 'is', null)
          .executeTakeFirst();
        logger.info(`${dryRun ? '[dry-run] ' : ''}import document`, {
          filename: attachment.filename,
          idFcu,
          networkType: source.networkType,
          size: content.length,
        });
        counts.imported++;
        if (dryRun) {
          continue;
        }
        await kdb.transaction().execute(async (trx) => {
          const file =
            sharedFile ??
            (await trx
              .insertInto('files')
              .values({
                content,
                content_type: (detected as NonNullable<typeof detected>).contentType,
                filename: attachment.filename,
                scan_status: 'skipped',
                sha256,
                size: content.length,
              })
              .returning('id')
              .executeTakeFirstOrThrow());
          await trx
            .insertInto('network_files')
            .values({ file_id: file.id, network_id: idFcu, network_type: source.networkType, position: existing.length + index })
            .execute();
        });
      }
    }
  }
  logger.info('import des documents Airtable terminé', counts);
  return counts;
};

/** Why an attachment cannot be published: anything but a PDF or a zip archive made of PDF (the former Airtable field held both). */
const describeRejection = async (contentType: string, content: Buffer): Promise<string | null> => {
  if (contentType === 'application/pdf') {
    return null;
  }
  if (contentType !== 'application/zip') {
    return 'ni PDF ni archive zip';
  }
  const entries = await listZipEntries(bufferZipReader(content)).catch(() => null);
  if (!entries) {
    return 'archive zip illisible';
  }
  const rejected = entries.find((entry) => !entry.name.endsWith('/') && !entry.name.toLowerCase().endsWith('.pdf'));
  return rejected ? `archive zip contenant un fichier non PDF : ${rejected.name}` : null;
};

export const registerImportAirtableDocumentsCommand = (program: Command) => {
  program
    .command('reseaux:import-airtable-documents')
    .description(
      'Reprend les documents (PDF ou archives zip de PDF) attachés aux réseaux de chaleur et de froid dans Airtable vers la base (idempotent, une archive partagée est stockée une fois)'
    )
    .option('--dry-run', 'Liste les documents sans les importer', false)
    .action(async (options) => {
      await importAirtableNetworkDocuments({ dryRun: options.dryRun });
    });
};
