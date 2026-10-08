import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';
import XLSX from 'xlsx';

import { allowedFileTypes } from '@/modules/files/constants';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedReseauDeFroid, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

/** A row of the FEDENE library: the heat network 9101C unless overridden. */
const fedeneRow = (overrides: Record<string, unknown>) => ({
  Commune: 'Massy',
  Gestionnaire: 'Dalkia',
  'Groupe gestionnaire': 'EDF',
  'ID EARCF': '9101C',
  "Maitre d'Ouvrage": 'Ville de Massy',
  Nom: 'Réseau de Massy',
  'Nombre points de livraison': 42,
  ...overrides,
});

/** A FEDENE library made of the given rows, stored as an uploaded xlsx file. */
const seedFedeneFile = async (id: string, rows: Record<string, unknown>[]) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'BDD - complète');
  const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  await kdb
    .insertInto('files')
    .values({
      content,
      content_type: allowedFileTypes['.xlsx'].contentType,
      filename: 'bibliotheque-fedene.xlsx',
      id,
      scan_status: 'skipped',
      sha256: 'xlsx',
      size: content.length,
    })
    .execute();
};

const networkProvenance = () =>
  kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['nom_reseau', 'nom_reseau_fcu', 'Gestionnaire', 'gestionnaire_fcu', 'nb_pdl'])
    .where('id_fcu', '=', 1)
    .executeTakeFirstOrThrow();

describe('fedeneSurvey', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([{ ...testUsers.admin }, { ...testUsers.gestionnaire }]);
    // 9101C: name and gestionnaire corrected by FCU, the older survey said otherwise
    await seedReseauDeChaleur({
      gestionnaire_fcu: 'Exploitant actuel',
      gestionnaire_fedene: 'Ancien exploitant',
      'Identifiant reseau': '9101C',
      id_fcu: 1,
      nom_reseau_fcu: 'Massy (admin)',
      nom_reseau_fedene: 'Massy',
    } as any);
    await seedFedeneFile(uuid(1), [fedeneRow({})]);
  });

  describe('authorization', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      it(`${user ? user.role : 'anonymous'} ${allowed ? 'can' : 'cannot'} use the FEDENE survey page`, async () => {
        const caller = createTestCaller(user);
        const input = { fileId: uuid(1) };
        if (allowed) {
          await expect(caller.fedeneSurvey.listDiscrepancies()).resolves.toStrictEqual([]);
          await expect(caller.fedeneSurvey.previewImport(input)).resolves.toMatchObject({ dryRun: true });
        } else {
          await expect(caller.fedeneSurvey.listDiscrepancies()).rejects.toMatchObject(forbiddenError);
          await expect(caller.fedeneSurvey.previewImport(input)).rejects.toMatchObject(forbiddenError);
          await expect(caller.fedeneSurvey.applyImport(input)).rejects.toMatchObject(forbiddenError);
          await expect(caller.fedeneSurvey.clearDiscrepancies()).rejects.toMatchObject(forbiddenError);
          await expect(
            caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'gestionnaire', requestId: uuid(2) })
          ).rejects.toMatchObject(forbiddenError);
        }
      });
    });
  });

  it('simulates the import without writing anything, then imports it and lists the discrepancies to decide', async () => {
    const caller = createTestCaller(testUsers.admin);

    const preview = await caller.fedeneSurvey.previewImport({ fileId: uuid(1) });

    expect(preview).toStrictEqual({
      chaleur: {
        changed: 1,
        clearedCorrections: 0,
        created: [],
        discrepancyFields: 2,
        discrepancyNetworks: 1,
        missing: [],
        updated: 1,
      },
      dryRun: true,
      filename: 'bibliotheque-fedene.xlsx',
      froid: { changed: 0, clearedCorrections: 0, created: [], discrepancyFields: 0, discrepancyNetworks: 0, missing: [], updated: 0 },
      ignoredRows: 0,
      rows: 1,
    });
    expect(await networkProvenance()).toMatchObject({ nb_pdl: null });
    expect(await caller.fedeneSurvey.listDiscrepancies()).toStrictEqual([]);

    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });

    expect(await networkProvenance()).toStrictEqual({
      Gestionnaire: 'Exploitant actuel',
      gestionnaire_fcu: 'Exploitant actuel',
      nb_pdl: 42,
      nom_reseau: 'Massy (admin)',
      nom_reseau_fcu: 'Massy (admin)',
    });
    const discrepancies = await caller.fedeneSurvey.listDiscrepancies();
    expect(discrepancies.map(({ requestId, ...discrepancy }) => discrepancy)).toStrictEqual([
      {
        fields: [
          { fcuValue: 'Massy (admin)', fedeneValue: 'Réseau de Massy', field: 'nomReseau' },
          { fcuValue: 'Exploitant actuel', fedeneValue: 'Dalkia (EDF)', field: 'gestionnaire' },
        ],
        networkId: 1,
        networkName: 'Massy (admin)',
        networkType: 'reseau_de_chaleur',
        sncu: '9101C',
      },
    ]);
    expect(
      await kdb.selectFrom('events').select(['type', 'author_id']).where('type', '=', 'fedene_survey_imported').execute()
    ).toStrictEqual([{ author_id: testUsers.admin.id, type: 'fedene_survey_imported' }]);
  });

  it('decides each field on its own: restoring drops the correction, keeping changes nothing, the discrepancy is closed once all are decided', async () => {
    const caller = createTestCaller(testUsers.admin);
    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });
    const [{ requestId }] = await caller.fedeneSurvey.listDiscrepancies();

    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'restore_fedene', field: 'gestionnaire', requestId });

    expect(await networkProvenance()).toMatchObject({ Gestionnaire: 'Dalkia (EDF)', gestionnaire_fcu: null });
    expect(
      (await caller.fedeneSurvey.listDiscrepancies()).flatMap((discrepancy) => discrepancy.fields.map(({ field }) => field))
    ).toStrictEqual(['nomReseau']);
    await expect(caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'gestionnaire', requestId })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });

    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'nomReseau', requestId });

    expect(await networkProvenance()).toMatchObject({ nom_reseau: 'Massy (admin)', nom_reseau_fcu: 'Massy (admin)' });
    expect(await caller.fedeneSurvey.listDiscrepancies()).toStrictEqual([]);
    expect(
      await kdb.selectFrom('network_change_requests').select(['status', 'processed_by', 'payload']).where('id', '=', requestId).execute()
    ).toStrictEqual([
      {
        payload: {
          decisions: { gestionnaire: 'restore_fedene', nomReseau: 'keep_fcu' },
          gestionnaire: 'Dalkia (EDF)',
          nomReseau: 'Réseau de Massy',
        },
        processed_by: testUsers.admin.id,
        status: 'processed',
      },
    ]);
    const processedEvents = await kdb
      .selectFrom('events')
      .select(['data'])
      .where('type', '=', 'network_change_request_processed')
      .execute();
    expect(processedEvents.map((event) => (event.data as { applied: boolean }).applied)).toStrictEqual([true]);
    // the restored gestionnaire is shown on the map: the tiles are queued for a rebuild
    expect(
      await kdb.selectFrom('jobs').select('type').where('type', '=', 'build_tiles').where('status', '=', 'pending').execute()
      // heat networks, cold networks (import) and construction networks (extensions copy the gestionnaire)
    ).toStrictEqual([{ type: 'build_tiles' }, { type: 'build_tiles' }, { type: 'build_tiles' }]);
  });

  it('keeps a decision taken on a pending discrepancy when the same file is imported again', async () => {
    const caller = createTestCaller(testUsers.admin);
    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });
    const [{ requestId }] = await caller.fedeneSurvey.listDiscrepancies();
    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'gestionnaire', requestId });

    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });

    expect(
      (await caller.fedeneSurvey.listDiscrepancies()).flatMap((discrepancy) => discrepancy.fields.map(({ field }) => field))
    ).toStrictEqual(['nomReseau']);
  });

  it('clears the pending discrepancies, recreated by the next import, and keeps the processed ones', async () => {
    const caller = createTestCaller(testUsers.admin);
    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });

    expect(await caller.fedeneSurvey.clearDiscrepancies()).toStrictEqual({ count: 1 });
    expect(await caller.fedeneSurvey.listDiscrepancies()).toStrictEqual([]);

    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });
    expect((await caller.fedeneSurvey.listDiscrepancies()).map((discrepancy) => discrepancy.sncu)).toStrictEqual(['9101C']);
  });

  it('refuses a file that is not the FEDENE library, a file without « ID EARCF » and a duplicated id', async () => {
    await seedFedeneFile(uuid(3), [fedeneRow({})]);
    await kdb
      .updateTable('files')
      .set({ content: Buffer.from('not an excel file') })
      .where('id', '=', uuid(3))
      .execute();
    await seedFedeneFile(uuid(4), [{ Nom: 'Réseau sans identifiant', Numéro: 1 }]);
    await seedFedeneFile(uuid(5), [fedeneRow({}), fedeneRow({ Nom: 'Même réseau, deux lignes' })]);
    const caller = createTestCaller(testUsers.admin);

    await expect(caller.fedeneSurvey.previewImport({ fileId: uuid(3) })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.fedeneSurvey.previewImport({ fileId: uuid(4) })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('ID EARCF'),
    });
    await expect(caller.fedeneSurvey.previewImport({ fileId: uuid(5) })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('en double'),
    });
  });

  it('does not count a kept correction as a discrepancy in the next simulation', async () => {
    const caller = createTestCaller(testUsers.admin);
    await caller.fedeneSurvey.applyImport({ fileId: uuid(1) });
    const [{ requestId }] = await caller.fedeneSurvey.listDiscrepancies();
    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'gestionnaire', requestId });
    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'keep_fcu', field: 'nomReseau', requestId });

    const preview = await caller.fedeneSurvey.previewImport({ fileId: uuid(1) });

    expect({ fields: preview.chaleur.discrepancyFields, networks: preview.chaleur.discrepancyNetworks }).toStrictEqual({
      fields: 0,
      networks: 0,
    });
  });

  it('restores the survey value of a cold network', async () => {
    await seedReseauDeFroid({
      gestionnaire_fcu: 'Froid corrigé',
      'Identifiant reseau': '9101F',
      id_fcu: 1,
      nom_reseau_fedene: 'Froid',
    } as any);
    await seedFedeneFile(uuid(6), [fedeneRow({ 'ID EARCF': '9101F', Nom: 'Froid' })]);
    const caller = createTestCaller(testUsers.admin);
    await caller.fedeneSurvey.applyImport({ fileId: uuid(6) });
    const [{ requestId }] = await caller.fedeneSurvey.listDiscrepancies();

    await caller.fedeneSurvey.resolveDiscrepancy({ decision: 'restore_fedene', field: 'gestionnaire', requestId });

    expect(
      await kdb
        .selectFrom('reseaux_de_froid')
        .select(['Gestionnaire', 'gestionnaire_fcu'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ Gestionnaire: 'Dalkia (EDF)', gestionnaire_fcu: null });
    expect(await caller.fedeneSurvey.listDiscrepancies()).toStrictEqual([]);
  });
});
