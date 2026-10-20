import { sql } from 'kysely';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

import { fileOwnerTables, purgeOrphanFiles, purgeUnownedFileContents } from './service';

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

const seedFile = (id: string, createdAt = new Date()) =>
  kdb
    .insertInto('files')
    .values({
      content: Buffer.from('%PDF-1.7 test'),
      content_type: 'application/pdf',
      created_at: createdAt,
      filename: `document-${id.slice(-2)}.pdf`,
      id,
      scan_status: 'skipped',
      sha256: 'abc',
      size: 13,
    })
    .execute();

const attachToRequest = async (requestId: string, fileIds: string[]) => {
  await kdb
    .insertInto('network_change_requests')
    .values({ contact_type: 'autre', id: requestId, kind: 'autre', network_label: 'Réseau test', payload: '{}' })
    .execute();
  await kdb
    .insertInto('network_change_request_files')
    .values(fileIds.map((fileId) => ({ file_id: fileId, request_id: requestId, role: 'document' as const })))
    .execute();
};

const publishOnNetwork = (fileId: string) =>
  kdb.insertInto('network_files').values({ file_id: fileId, network_id: 1, network_type: 'reseau_de_chaleur' }).execute();

const listFiles = async () =>
  await kdb
    .selectFrom('files')
    .select(['id', (eb) => eb('content', 'is not', null).as('has_content'), (eb) => eb('purged_at', 'is not', null).as('purged')])
    .orderBy('id')
    .execute();

describe('files service', () => {
  beforeEach(cleanDatabase);

  it('lists every table holding a foreign key to files as an owner', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT DISTINCT conrelid::regclass::text AS table_name FROM pg_constraint WHERE contype = 'f' AND confrelid = 'files'::regclass
    `.execute(kdb);
    expect(rows.map((row) => row.table_name).sort()).toStrictEqual([...fileOwnerTables].sort());
  });

  it('purgeOrphanFiles deletes old files referenced by no owner only', async () => {
    await Promise.all([
      seedFile(uuid(1), thirtyDaysAgo),
      seedFile(uuid(2), thirtyDaysAgo),
      seedFile(uuid(3), thirtyDaysAgo),
      seedFile(uuid(4)),
    ]);
    await attachToRequest(uuid(10), [uuid(2)]);
    await publishOnNetwork(uuid(3));

    await purgeOrphanFiles();

    expect((await listFiles()).map((file) => file.id)).toStrictEqual([uuid(2), uuid(3), uuid(4)].sort());
  });

  it('purgeUnownedFileContents keeps the content of a file another owner still references', async () => {
    await Promise.all([seedFile(uuid(1)), seedFile(uuid(2)), seedFile(uuid(3))]);
    await attachToRequest(uuid(10), [uuid(1), uuid(2)]);
    await publishOnNetwork(uuid(2));
    await publishOnNetwork(uuid(3));

    // the files of a processed request: the published one belongs to the network now
    await purgeUnownedFileContents([uuid(1), uuid(2)], 'network_change_request_files');
    // a document unpublished from a network while its request still references it
    await purgeUnownedFileContents([uuid(3)], 'network_files');

    expect(await listFiles()).toStrictEqual(
      [
        { has_content: false, id: uuid(1), purged: true },
        { has_content: true, id: uuid(2), purged: false },
        { has_content: false, id: uuid(3), purged: true },
      ].sort((a, b) => a.id.localeCompare(b.id))
    );
  });
});
