import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

const target = { networkId: 1, networkType: 'reseau_de_chaleur' as const };

const seedFile = (id: string, overrides: { content_type?: string; scan_status?: 'pending' | 'clean' | 'skipped' } = {}) =>
  kdb
    .insertInto('files')
    .values({
      content: Buffer.from('%PDF-1.7 test'),
      content_type: 'application/pdf',
      filename: `document-${id.slice(-2)}.pdf`,
      id,
      scan_status: 'skipped',
      sha256: id,
      size: 13,
      ...overrides,
    })
    .execute();

describe('reseaux.documents', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([{ ...testUsers.admin }, { ...testUsers.gestionnaire }]);
    await seedReseauDeChaleur({ 'Identifiant reseau': '7501C', id_fcu: 1, nom_reseau: 'Réseau de test' } as any);
    await Promise.all([seedFile(uuid(20)), seedFile(uuid(21)), seedFile(uuid(22)), seedFile(uuid(23))]);
    await seedFile(uuid(30), { content_type: 'application/msword' });
    await seedFile(uuid(32), { content_type: 'application/zip' });
    await seedFile(uuid(31), { scan_status: 'pending' });
  });

  adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`${user ? user.role : 'anonymous'} ${allowed ? 'can' : 'cannot'} manage documents`, async () => {
      const caller = createTestCaller(user);
      if (allowed) {
        await expect(caller.reseaux.documents.list(target)).resolves.toStrictEqual([]);
      } else {
        await expect(caller.reseaux.documents.list(target)).rejects.toMatchObject(forbiddenError);
        await expect(caller.reseaux.documents.add({ ...target, fileIds: [uuid(20)] })).rejects.toMatchObject(forbiddenError);
        await expect(caller.reseaux.documents.remove({ ...target, fileId: uuid(20) })).rejects.toMatchObject(forbiddenError);
      }
    });
  });

  it('publishes, lists and unpublishes documents, purging the content once unpublished', async () => {
    const caller = createTestCaller(testUsers.admin);

    await caller.reseaux.documents.add({ ...target, fileIds: [uuid(20), uuid(21)] });
    expect((await caller.reseaux.documents.list(target)).map((document) => document.id)).toStrictEqual([uuid(20), uuid(21)]);

    await caller.reseaux.documents.remove({ ...target, fileId: uuid(20) });
    expect((await caller.reseaux.documents.list(target)).map((document) => document.id)).toStrictEqual([uuid(21)]);
    expect(await kdb.selectFrom('files').select('content').where('id', '=', uuid(20)).executeTakeFirstOrThrow()).toStrictEqual({
      content: null,
    });
    expect(await kdb.selectFrom('events').select('type').execute()).toStrictEqual([
      { type: 'network_updated' },
      { type: 'network_updated' },
    ]);
  });

  it('caps the number of documents per network', async () => {
    const caller = createTestCaller(testUsers.admin);
    await caller.reseaux.documents.add({ ...target, fileIds: [uuid(20), uuid(21), uuid(22)] });

    await expect(caller.reseaux.documents.add({ ...target, fileIds: [uuid(23)] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('publishes a zip archive (schéma directeur en plusieurs parties) like a PDF', async () => {
    const caller = createTestCaller(testUsers.admin);

    await caller.reseaux.documents.add({ ...target, fileIds: [uuid(32)] });

    expect((await caller.reseaux.documents.list(target)).map((document) => document.type)).toStrictEqual(['application/zip']);
  });

  const rejected: [string, string][] = [
    ['a file that is neither a PDF nor a zip archive', uuid(30)],
    ['a file still being scanned', uuid(31)],
    ['an unknown file', uuid(99)],
  ];
  it.each(rejected)('rejects %s', async (_, fileId) => {
    const caller = createTestCaller(testUsers.admin);

    await expect(caller.reseaux.documents.add({ ...target, fileIds: [fileId] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('returns NOT_FOUND when removing a document that is not published', async () => {
    const caller = createTestCaller(testUsers.admin);

    await expect(caller.reseaux.documents.remove({ ...target, fileId: uuid(20) })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
