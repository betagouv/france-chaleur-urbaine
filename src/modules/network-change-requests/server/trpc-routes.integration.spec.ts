import type { User } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmailTemplate } from '@/modules/email';
import { documentChangeKey, documentRemovalChangeKey } from '@/modules/network-change-requests/document-change-keys';
import { sharedStore } from '@/modules/security/server/rate-limit';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import type { CreateNetworkChangeRequestInput } from '../constants';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.professionnel },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: false, input: testUsers.collectivite },
  { expectedOutput: false, input: testUsers.alec },
  { expectedOutput: true, input: testUsers.admin },
];

const ficheInput: CreateNetworkChangeRequestInput = {
  contact: { email: 'marie@ville.fr', firstName: 'Marie', lastName: 'Dupont', structure: 'Ville de Test', type: 'collectivite' },
  files: [],
  kind: 'fiche',
  network: { id: 1, type: 'reseau_de_chaleur' },
  networkLabel: '7501C - Réseau de test',
  payload: { informationsComplementaires: 'Extension prévue en 2027' },
};

const seedFile = (id: string, overrides: { content_type?: string; scan_status?: 'pending' | 'clean' | 'infected' | 'skipped' } = {}) =>
  kdb
    .insertInto('files')
    .values({
      content: Buffer.from('%PDF-1.7 test'),
      content_type: 'application/pdf',
      filename: `document-${id.slice(-2)}.pdf`,
      id,
      scan_status: 'skipped',
      sha256: 'abc',
      size: 13,
      ...overrides,
    })
    .execute();

const listEvents = (type: string) =>
  kdb
    .selectFrom('events')
    .select(['type', 'author_id', 'context_type', 'context_id', 'data'])
    .where('type', '=', type as any)
    .execute();

describe('networkChangeRequests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(sendEmailTemplate).mockClear();
    // `create` is rate-limited per IP: every test caller shares the same mock IP
    sharedStore.resetAll();
    await seedTableUser([{ ...testUsers.admin }, { ...testUsers.gestionnaire }]);
    await seedReseauDeChaleur({ 'Identifiant reseau': '7501C', id_fcu: 1, nom_reseau: 'Réseau de test' } as any);
    await seedFile(uuid(20));
    await seedFile(uuid(21), { content_type: 'application/zip' });
    await seedFile(uuid(22), { scan_status: 'infected' });
  });

  describe('create', () => {
    it('stores a fiche request from an anonymous submitter, traces an event and sends the acknowledgement', async () => {
      const caller = createTestCaller(null);

      const { id } = await caller.networkChangeRequests.create(ficheInput);

      const request = await kdb
        .selectFrom('network_change_requests')
        .select(['kind', 'status', 'network_type', 'network_id', 'network_label', 'user_id', 'contact_email', 'contact_type', 'payload'])
        .where('id', '=', id)
        .executeTakeFirstOrThrow();
      expect(request).toStrictEqual({
        contact_email: 'marie@ville.fr',
        contact_type: 'collectivite',
        kind: 'fiche',
        network_id: 1,
        network_label: '7501C - Réseau de test',
        network_type: 'reseau_de_chaleur',
        payload: ficheInput.payload,
        status: 'pending',
        user_id: null,
      });
      expect(await listEvents('network_change_request_created')).toStrictEqual([
        {
          author_id: null,
          context_id: id,
          context_type: 'network_change_request',
          data: {
            kind: 'fiche',
            network_id: 1,
            network_label: '7501C - Réseau de test',
            network_type: 'reseau_de_chaleur',
            request_id: id,
          },
          type: 'network_change_request_created',
        },
      ]);
      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
        [
          'reseaux.demandeur.accuse-reception',
          { email: 'marie@ville.fr' },
          { kind: 'fiche', kindLabel: 'Modification de la fiche du réseau', networkLabel: '7501C - Réseau de test' },
        ],
      ]);
    });

    it('links the submitter account and the attached documents', async () => {
      const caller = createTestCaller(testUsers.gestionnaire);

      const { id } = await caller.networkChangeRequests.create({ ...ficheInput, files: [{ id: uuid(20), role: 'document' }] });

      const request = await kdb.selectFrom('network_change_requests').select(['user_id']).where('id', '=', id).executeTakeFirstOrThrow();
      expect(request).toStrictEqual({ user_id: testUsers.gestionnaire.id });
      expect(
        await kdb.selectFrom('network_change_request_files').select(['file_id', 'role']).where('request_id', '=', id).execute()
      ).toStrictEqual([{ file_id: uuid(20), role: 'document' }]);
      const [event] = await listEvents('network_change_request_created');
      expect(event.author_id).toStrictEqual(testUsers.gestionnaire.id);
    });

    it('rejects an unknown network', async () => {
      const caller = createTestCaller(null);

      await expect(
        caller.networkChangeRequests.create({ ...ficheInput, network: { id: 999, type: 'reseau_de_froid' } })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('rejects an email of the forbidden list with the vague message', async () => {
      const caller = createTestCaller(null);

      await expect(
        caller.networkChangeRequests.create({ ...ficheInput, contact: { ...ficheInput.contact, email: 'sample@tst.com' } })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Une erreur est survenue lors de la validation de votre demande',
      });
    });

    it('rejects a request without a network reference when the network is unknown and the label is empty', async () => {
      const caller = createTestCaller(null);

      await expect(caller.networkChangeRequests.create({ ...ficheInput, network: null, networkLabel: '' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    const invalidFiles: [string, CreateNetworkChangeRequestInput['files']][] = [
      ['a role not allowed for the kind', [{ id: uuid(20), role: 'trace' }]],
      ['a file type not allowed for the role', [{ id: uuid(21), role: 'document' }]],
      ['an infected file', [{ id: uuid(22), role: 'document' }]],
      ['an unknown file', [{ id: uuid(99), role: 'document' }]],
      [
        'a file referenced twice',
        [
          { id: uuid(20), role: 'document' },
          { id: uuid(20), role: 'document' },
        ],
      ],
    ];
    it.each(invalidFiles)('rejects %s', async (_, files) => {
      const caller = createTestCaller(null);

      await expect(caller.networkChangeRequests.create({ ...ficheInput, files })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(await kdb.selectFrom('network_change_requests').select('id').execute()).toStrictEqual([]);
    });

    it('rejects a trace request without a trace file', async () => {
      const caller = createTestCaller(null);

      await expect(
        caller.networkChangeRequests.create({
          ...ficheInput,
          kind: 'trace_existant',
          payload: {
            dansCadreDemandeADEME: false,
            gestionnaire: 'Exploitant SA',
            maitreOuvrage: 'Ville',
            ouvertAuxRaccordements: false,
            reseauClasse: null,
          },
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('refuses a file already attached to another request', async () => {
      const caller = createTestCaller(null);
      await caller.networkChangeRequests.create({ ...ficheInput, files: [{ id: uuid(20), role: 'document' }] });

      await expect(
        caller.networkChangeRequests.create({ ...ficheInput, files: [{ id: uuid(20), role: 'document' }] })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });
  });

  describe('admin routes authorization', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      const label = user ? user.role : 'anonymous';
      it(`${label} ${allowed ? 'can' : 'cannot'} list, count, retry a conversion and accept`, async () => {
        const { id } = await createTestCaller(null).networkChangeRequests.create(ficheInput);
        const caller = createTestCaller(user);

        if (allowed) {
          expect((await caller.networkChangeRequests.admin.list()).map((request) => request.id)).toStrictEqual([id]);
          expect(await caller.networkChangeRequests.admin.countPending()).toStrictEqual(1);
          await expect(caller.networkChangeRequests.admin.getReviewContext({ id })).resolves.toBeDefined();
          await expect(caller.networkChangeRequests.admin.retryGeometryConversion({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' }); // no geo file
          await expect(caller.networkChangeRequests.admin.accept({ id, included: [] })).resolves.toBeUndefined();
          await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' }); // already rejected
        } else {
          await expect(caller.networkChangeRequests.admin.list()).rejects.toMatchObject(forbiddenError);
          await expect(caller.networkChangeRequests.admin.countPending()).rejects.toMatchObject(forbiddenError);
          await expect(caller.networkChangeRequests.admin.getReviewContext({ id })).rejects.toMatchObject(forbiddenError);
          await expect(caller.networkChangeRequests.admin.retryGeometryConversion({ id })).rejects.toMatchObject(forbiddenError);
          await expect(caller.networkChangeRequests.admin.accept({ id, included: [] })).rejects.toMatchObject(forbiddenError);
          await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject(forbiddenError);
        }
      });
    });
  });

  describe('admin.accept', () => {
    it('applies a fiche request to the network, publishes its documents, traces the events and emails the publication', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(20), role: 'document' }],
      });
      vi.mocked(sendEmailTemplate).mockClear();
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['Gestionnaire', 'informationsComplementaires'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow();
      // the fiche form no longer carries survey fields: only the complementary information is written
      expect(network).toStrictEqual({ Gestionnaire: null, informationsComplementaires: 'Extension prévue en 2027' });
      expect(await caller.reseaux.documents.list({ networkId: 1, networkType: 'reseau_de_chaleur' })).toStrictEqual([
        { filename: `document-${uuid(20).slice(-2)}.pdf`, id: uuid(20), size: 13, type: 'application/pdf' },
      ]);
      const [request] = await caller.networkChangeRequests.admin.list();
      expect({ processor: request.processed_by_email, status: request.status }).toStrictEqual({
        processor: testUsers.admin.email,
        status: 'processed',
      });
      expect((await kdb.selectFrom('events').select('type').orderBy('type').execute()).map((event) => event.type)).toStrictEqual([
        'network_change_request_created',
        'network_change_request_processed',
        'network_updated',
      ]);
      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
        ['reseaux.demandeur.demande-acceptee', { email: 'marie@ville.fr' }, { kind: 'fiche', networkPageUrl: '/reseaux/7501C' }],
      ]);
      expect((await caller.networkChangeRequests.admin.list())[0].notified).toStrictEqual(true);
    });

    it('closes a request without changes silently, and emails a publication', async () => {
      const closed = await createTestCaller(null).networkChangeRequests.create(ficheInput);
      const published = await createTestCaller(null).networkChangeRequests.create(ficheInput);
      const caller = createTestCaller(testUsers.admin);
      vi.mocked(sendEmailTemplate).mockClear();

      await caller.networkChangeRequests.admin.accept({ id: closed.id, included: [] });
      await caller.networkChangeRequests.admin.accept({ id: published.id });

      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
        ['reseaux.demandeur.demande-acceptee', { email: 'marie@ville.fr' }, { kind: 'fiche', networkPageUrl: '/reseaux/7501C' }],
      ]);
      const requests = await caller.networkChangeRequests.admin.list();
      expect(requests.map((request) => ({ notified: request.notified, status: request.status }))).toStrictEqual([
        { notified: true, status: 'processed' },
        { notified: false, status: 'processed' },
      ]);
      // the closed request is traced as such, and touches no network data
      const processed = await listEvents('network_change_request_processed');
      expect(processed.map((event) => ({ applied: (event.data as { applied: boolean }).applied, id: event.context_id }))).toStrictEqual([
        { applied: false, id: closed.id },
        { applied: true, id: published.id },
      ]);
      expect((await listEvents('network_updated')).map((event) => (event.data as { request_id: string }).request_id)).toStrictEqual([
        published.id,
      ]);
    });

    it('applies only the included changes when the admin excludes some', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(20), role: 'document' }],
      });
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id, included: ['informationsComplementaires'] });

      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['informationsComplementaires'])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow();
      expect(network).toStrictEqual({ informationsComplementaires: 'Extension prévue en 2027' });
      expect(await caller.reseaux.documents.list({ networkId: 1, networkType: 'reseau_de_chaleur' })).toStrictEqual([]);
      expect((await caller.networkChangeRequests.admin.list())[0].status).toStrictEqual('processed');
    });

    it('accepts a fiche request that only adds documents (no column to update)', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(20), role: 'document' }],
        payload: {},
      });
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id, included: [documentChangeKey(uuid(20))] });

      expect(
        (await caller.reseaux.documents.list({ networkId: 1, networkType: 'reseau_de_chaleur' })).map((document) => document.id)
      ).toStrictEqual([uuid(20)]);
      expect((await caller.networkChangeRequests.admin.list())[0].status).toStrictEqual('processed');
    });

    it('keeps the published documents when a new document is not scanned yet (nothing applied, request still pending)', async () => {
      await seedFile(uuid(24));
      await seedFile(uuid(27), { scan_status: 'pending' });
      await kdb
        .insertInto('network_files')
        .values({ file_id: uuid(24), network_id: 1, network_type: 'reseau_de_chaleur', position: 0 })
        .execute();
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(27), role: 'document' }],
        payload: { documentsToRemove: [uuid(24)] },
      });
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' });

      expect(
        (await caller.reseaux.documents.list({ networkId: 1, networkType: 'reseau_de_chaleur' })).map((document) => document.id)
      ).toStrictEqual([uuid(24)]);
      expect(await kdb.selectFrom('files').select('purged_at').where('id', '=', uuid(24)).executeTakeFirstOrThrow()).toStrictEqual({
        purged_at: null,
      });
      expect((await caller.networkChangeRequests.admin.list())[0].status).toStrictEqual('pending');
    });

    it('takes down the published documents the submitter asked to remove, file by file', async () => {
      await seedFile(uuid(24));
      await seedFile(uuid(25));
      await kdb
        .insertInto('network_files')
        .values([
          { file_id: uuid(24), network_id: 1, network_type: 'reseau_de_chaleur', position: 0 },
          { file_id: uuid(25), network_id: 1, network_type: 'reseau_de_chaleur', position: 1 },
        ])
        .execute();
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(20), role: 'document' }],
        payload: { documentsToRemove: [uuid(24), uuid(25)] },
      });
      const caller = createTestCaller(testUsers.admin);

      // the admin keeps the second document: only the first removal and the new file are applied
      await caller.networkChangeRequests.admin.accept({ id, included: [documentRemovalChangeKey(uuid(24)), documentChangeKey(uuid(20))] });

      expect(
        (await caller.reseaux.documents.list({ networkId: 1, networkType: 'reseau_de_chaleur' })).map((document) => document.id)
      ).toStrictEqual([uuid(25), uuid(20)]);
    });

    it('refuses a removal of a document not published on the network, and more documents than the cap', async () => {
      await seedFile(uuid(24));
      await seedFile(uuid(25));
      await seedFile(uuid(26));
      await kdb
        .insertInto('network_files')
        .values([
          { file_id: uuid(24), network_id: 1, network_type: 'reseau_de_chaleur', position: 0 },
          { file_id: uuid(25), network_id: 1, network_type: 'reseau_de_chaleur', position: 1 },
          { file_id: uuid(26), network_id: 1, network_type: 'reseau_de_chaleur', position: 2 },
        ])
        .execute();
      const caller = createTestCaller(null);

      await expect(
        caller.networkChangeRequests.create({ ...ficheInput, payload: { documentsToRemove: [uuid(99)] } })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
      await expect(
        caller.networkChangeRequests.create({ ...ficheInput, files: [{ id: uuid(20), role: 'document' }], payload: {} })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      await expect(
        caller.networkChangeRequests.create({
          ...ficheInput,
          files: [{ id: uuid(20), role: 'document' }],
          payload: { documentsToRemove: [uuid(24)] },
        })
      ).resolves.toMatchObject({ id: expect.any(String) });
    });

    it('refuses a concurrent second decision on the same request', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create(ficheInput);
      const caller = createTestCaller(testUsers.admin);

      const outcomes = await Promise.allSettled([
        caller.networkChangeRequests.admin.accept({ id }),
        caller.networkChangeRequests.admin.accept({ id, included: [] }),
      ]);

      expect(outcomes.map((outcome) => outcome.status).sort()).toStrictEqual(['fulfilled', 'rejected']);
      expect((await caller.networkChangeRequests.admin.list())[0].status).not.toStrictEqual('pending');
    });

    it('exposes the current network values for the review', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create(ficheInput);
      const caller = createTestCaller(testUsers.admin);

      expect(await caller.networkChangeRequests.admin.getReviewContext({ id })).toStrictEqual({
        network: {
          documents: [],
          gestionnaire: null,
          hasGeometry: false,
          id_fcu: 1,
          identifiant_reseau: '7501C',
          informationsComplementaires: null,
          maitreOuvrage: null,
          nom_reseau: 'Réseau de test',
          ouvertAuxRaccordements: true,
          reseauClasse: null,
          type: 'reseau_de_chaleur',
        },
        referentCommercial: null,
      });
    });

    it('refuses to accept a fiche request not attached to a network', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        network: null,
        networkLabel: 'Réseau inconnu',
      });
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('admin.accept of geo requests', () => {
    const lineGeometry: GeoJSON.Geometry = {
      coordinates: [
        [
          [2.35, 48.85],
          [2.36, 48.86],
        ],
      ],
      type: 'MultiLineString',
    };
    const polygonGeometry: GeoJSON.Geometry = {
      coordinates: [
        [
          [
            [2.35, 48.85],
            [2.36, 48.85],
            [2.36, 48.86],
            [2.35, 48.85],
          ],
        ],
      ],
      type: 'MultiPolygon',
    };
    const tracePayload = {
      dansCadreDemandeADEME: false,
      emailReferentCommercial: 'commercial@exploitant.fr',
      gestionnaire: 'Exploitant SA',
      maitreOuvrage: 'Ville',
      ouvertAuxRaccordements: true,
      reseauClasse: null,
    };
    const seedGeometry = (requestId: string, role: 'trace' | 'pdp', geometry: GeoJSON.Geometry) =>
      kdb
        .insertInto('network_change_request_geometries')
        .values({ geometry: JSON.stringify(geometry), request_id: requestId, role })
        .execute();
    const createTraceRequest = async (
      kind: 'trace_existant' | 'trace_construction',
      network: CreateNetworkChangeRequestInput['network']
    ) => {
      const common = {
        contact: ficheInput.contact,
        files: [{ id: uuid(21), role: 'trace' as const }],
        network,
        networkLabel: 'Réseau de Massy',
      };
      return createTestCaller(null).networkChangeRequests.create(
        kind === 'trace_existant'
          ? { ...common, kind, payload: tracePayload }
          : { ...common, kind, payload: { ...tracePayload, dateMiseEnServicePrevisionnelle: '2027' } }
      );
    };

    it('tells whether the commercial contact has an FCU account with rights on the network', async () => {
      await seedTableUser([{ email: 'commercial@exploitant.fr', id: uuid(50), role: 'gestionnaire' }]);
      await kdb
        .insertInto('user_permissions')
        .values({ resource_id: '1', type: 'reseau_de_chaleur', user_id: uuid(50) })
        .execute();
      const { id } = await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });
      const caller = createTestCaller(testUsers.admin);

      const context = await caller.networkChangeRequests.admin.getReviewContext({ id });

      expect(context.referentCommercial).toStrictEqual({
        account: { active: true, hasNetworkPermission: true, id: uuid(50), role: 'gestionnaire' },
        email: 'commercial@exploitant.fr',
      });
    });

    it('enqueues the geometry conversion when geo files are attached', async () => {
      await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });

      expect(await kdb.selectFrom('jobs').select(['type', 'status']).execute()).toStrictEqual([
        { status: 'pending', type: 'parse_request_geometries' },
      ]);
    });

    it('applies an existing network trace right away, updates the metadata and creates the linked PDP', async () => {
      const { id } = await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });
      await seedGeometry(id, 'trace', lineGeometry);
      await seedGeometry(id, 'pdp', polygonGeometry);
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select((eb) => [
          'Gestionnaire',
          'MO',
          'ouvert_aux_raccordements',
          'has_trace',
          'geom_update',
          eb.fn('ST_NPoints', ['geom']).as('points'),
        ])
        .where('id_fcu', '=', 1)
        .executeTakeFirstOrThrow();
      // the trace is live (no draft left) and the tiles are queued for a rebuild
      expect(network).toStrictEqual({
        Gestionnaire: 'Exploitant SA',
        geom_update: null,
        has_trace: true,
        MO: 'Ville',
        ouvert_aux_raccordements: true,
        points: 2,
      });
      expect(
        await kdb.selectFrom('zone_de_developpement_prioritaire').select(['reseau_de_chaleur_ids', 'geom_update']).execute()
      ).toStrictEqual([{ geom_update: null, reseau_de_chaleur_ids: [1] }]);
      expect((await kdb.selectFrom('jobs').select('type').where('type', '=', 'build_tiles').execute()).length).toBeGreaterThan(0);
      const [request] = await caller.networkChangeRequests.admin.list();
      expect(request.status).toStrictEqual('processed');
    });

    it('creates the heat network of an unattached existing network trace, with its perimeter', async () => {
      const { id } = await createTraceRequest('trace_existant', null);
      await seedGeometry(id, 'trace', lineGeometry);
      await seedGeometry(id, 'pdp', polygonGeometry);
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const [request] = await caller.networkChangeRequests.admin.list();
      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['id_fcu', 'nom_reseau', 'Gestionnaire', 'gestionnaire_fcu', 'MO', 'ouvert_aux_raccordements', 'has_trace', 'geom_update'])
        .where('id_fcu', '=', request.network_id as number)
        .executeTakeFirstOrThrow();
      // the request is attached to the created network; its values are FCU values (no survey yet)
      expect({ network, type: request.network_type }).toStrictEqual({
        network: {
          Gestionnaire: 'Exploitant SA',
          geom_update: null,
          gestionnaire_fcu: 'Exploitant SA',
          has_trace: true,
          id_fcu: request.network_id,
          MO: 'Ville',
          nom_reseau: 'Réseau de Massy',
          ouvert_aux_raccordements: true,
        },
        type: 'reseau_de_chaleur',
      });
      expect(await kdb.selectFrom('zone_de_developpement_prioritaire').select('reseau_de_chaleur_ids').execute()).toStrictEqual([
        { reseau_de_chaleur_ids: [request.network_id] },
      ]);
      expect((await listEvents('network_created')).map((event) => event.context_type).sort()).toStrictEqual([
        'perimetre_de_developpement_prioritaire',
        'reseau_de_chaleur',
      ]);
    });

    it('refuses to create the network of an unattached existing network trace made of a PDF only', async () => {
      await seedFile(uuid(23));
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        contact: ficheInput.contact,
        files: [{ id: uuid(23), role: 'trace' }],
        kind: 'trace_existant',
        network: null,
        networkLabel: 'Réseau inconnu',
        payload: tracePayload,
      });
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('tracé exploitable'),
      });
      expect((await caller.networkChangeRequests.admin.list())[0].status).toStrictEqual('pending');
    });

    it('refuses an existing network trace while its files are not converted, attached or not', async () => {
      const { id } = await createTraceRequest('trace_existant', null);
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      await caller.networkChangeRequests.admin.linkNetwork({ id, network: { id: 1, type: 'reseau_de_chaleur' } });
      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('pas encore convertis'),
      });
    });

    it('lets the admin replace the files of a role by a GeoJSON, read right away, keeping the original', async () => {
      const { id } = await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });
      await kdb
        .insertInto('files')
        .values({
          content: Buffer.from(JSON.stringify({ geometry: lineGeometry, properties: {}, type: 'Feature' })),
          content_type: 'application/geo+json',
          filename: 'trace-converti.geojson',
          id: uuid(30),
          scan_status: 'skipped',
          sha256: 'geo',
          size: 10,
        })
        .execute();
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.replaceGeometryFile({ fileId: uuid(30), id, role: 'trace' });

      const [request] = await caller.networkChangeRequests.admin.list();
      expect(request.files.map((file) => ({ id: file.id, replaced: file.replaced_at !== null }))).toStrictEqual([
        { id: uuid(21), replaced: true },
        { id: uuid(30), replaced: false },
      ]);
      expect(request.geometries.map((geometry) => ({ error: geometry.error, role: geometry.role }))).toStrictEqual([
        { error: null, role: 'trace' },
      ]);
      await expect(caller.networkChangeRequests.admin.accept({ id })).resolves.toBeUndefined();
    });

    it.each([
      { crs: { properties: { name: 'urn:ogc:def:crs:EPSG::2154' }, type: 'name' }, label: 'declared' },
      { crs: undefined, label: 'not declared' },
    ])('reprojects a Lambert 93 replacement GeoJSON to WGS84 (crs $label)', async ({ crs }) => {
      const { id } = await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });
      // Oberhausbergen (Strasbourg), as exported by a GIS in Lambert 93
      const lambert93 = {
        ...(crs ? { crs } : {}),
        features: [
          {
            geometry: {
              coordinates: [
                [
                  [1046325.95, 6844165.2],
                  [1046326.3, 6844165.6],
                ],
              ],
              type: 'MultiLineString',
            },
            properties: {},
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      };
      await kdb
        .insertInto('files')
        .values({
          content: Buffer.from(JSON.stringify(lambert93)),
          content_type: 'application/geo+json',
          filename: 'trace-lambert93.geojson',
          id: uuid(30),
          scan_status: 'skipped',
          sha256: 'geo',
          size: 10,
        })
        .execute();
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.replaceGeometryFile({ fileId: uuid(30), id, role: 'trace' });

      const geometry = (await caller.networkChangeRequests.admin.getRequestGeometry({ id, role: 'trace' })) as GeoJSON.MultiLineString;
      const [longitude, latitude] = geometry.coordinates[0][0];
      expect({ latitude: Math.round(latitude * 10) / 10, longitude: Math.round(longitude * 10) / 10 }).toStrictEqual({
        latitude: 48.6,
        longitude: 7.7,
      });
    });

    it('lets the admin replay a failed conversion: the error is cleared and a new job is queued', async () => {
      const { id } = await createTraceRequest('trace_existant', { id: 1, type: 'reseau_de_chaleur' });
      await kdb
        .insertInto('network_change_request_geometries')
        .values({ error: 'ogr2ogr : ERROR 4: Unable to open trace.shx', request_id: id, role: 'trace' })
        .execute();
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.retryGeometryConversion({ id });

      const [request] = await caller.networkChangeRequests.admin.list();
      expect(request.geometries).toStrictEqual([]);
      const jobs = await kdb
        .selectFrom('jobs')
        .select(['status', 'type'])
        .where('data', '@>', JSON.stringify({ requestId: id }))
        .execute();
      expect(jobs).toStrictEqual([
        { status: 'pending', type: 'parse_request_geometries' },
        { status: 'pending', type: 'parse_request_geometries' },
      ]);
      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' }); // still converting
    });

    it('creates a construction network as an extension of the linked heat network (name, gestionnaire and MO inherited)', async () => {
      await kdb
        .updateTable('reseaux_de_chaleur')
        .set({ gestionnaire_fedene: 'Parent SA', mo_fedene: 'Ville parent' })
        .where('id_fcu', '=', 1)
        .execute();
      const { id } = await createTraceRequest('trace_construction', { id: 1, type: 'reseau_de_chaleur' });
      await seedGeometry(id, 'trace', lineGeometry);
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const [created] = await kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select(['id_fcu', 'nom_reseau', 'gestionnaire', 'MO', 'mise_en_service', 'ouvert_aux_raccordements', 'reseau_de_chaleur_id'])
        .execute();
      expect(created).toStrictEqual({
        gestionnaire: 'Parent SA',
        id_fcu: created.id_fcu,
        MO: 'Ville parent',
        mise_en_service: '2027',
        nom_reseau: 'Réseau de test',
        ouvert_aux_raccordements: true,
        reseau_de_chaleur_id: 1,
      });
      const [request] = await caller.networkChangeRequests.admin.list();
      expect({ network_id: request.network_id, network_type: request.network_type }).toStrictEqual({
        network_id: created.id_fcu,
        network_type: 'reseau_en_construction',
      });
    });

    it('creates a standalone construction network with the submitted values when the request is not linked', async () => {
      const { id } = await createTraceRequest('trace_construction', null);
      await seedGeometry(id, 'trace', lineGeometry);
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const [created] = await kdb
        .selectFrom('zones_et_reseaux_en_construction')
        .select(['nom_reseau', 'gestionnaire', 'MO', 'mise_en_service', 'ouvert_aux_raccordements', 'reseau_de_chaleur_id'])
        .execute();
      expect(created).toStrictEqual({
        gestionnaire: 'Exploitant SA',
        MO: 'Ville',
        mise_en_service: '2027',
        nom_reseau: 'Réseau de Massy',
        ouvert_aux_raccordements: true,
        reseau_de_chaleur_id: null,
      });
    });

    it('accepts a perimeter request made of a PDF only without creating anything (drawn by hand)', async () => {
      await seedFile(uuid(23));
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(23), role: 'pdp' }],
        kind: 'pdp',
        payload: { dansCadreDemandeADEME: false, localisation: 'Massy' },
      });
      const caller = createTestCaller(testUsers.admin);
      vi.mocked(sendEmailTemplate).mockClear();

      await caller.networkChangeRequests.admin.accept({ id });

      expect(await kdb.selectFrom('zone_de_developpement_prioritaire').select('id_fcu').execute()).toStrictEqual([]);
      expect((await caller.networkChangeRequests.admin.list())[0]).toMatchObject({ notified: false, status: 'processed' });
      // nothing was published: no publication email
      expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([]);
    });

    it('rejects a construction request whose perimeter conversion failed before creating anything', async () => {
      const { id } = await createTraceRequest('trace_construction', null);
      await seedGeometry(id, 'trace', lineGeometry);
      await kdb
        .insertInto('network_change_request_geometries')
        .values({ error: 'ogr2ogr : ERROR 1: invalid polygon', request_id: id, role: 'pdp' })
        .execute();
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('invalid polygon'),
      });

      // no half-applied request: the network is not created and the request is still pending
      expect(await kdb.selectFrom('zones_et_reseaux_en_construction').select('id_fcu').execute()).toStrictEqual([]);
      expect((await caller.networkChangeRequests.admin.list())[0].status).toStrictEqual('pending');
    });

    it('creates the perimeter of a perimeter request, linked to the network', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        files: [{ id: uuid(21), role: 'pdp' }],
        kind: 'pdp',
        payload: { dansCadreDemandeADEME: false, localisation: 'Massy' },
      });
      await seedGeometry(id, 'pdp', polygonGeometry);
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      const [pdp] = await kdb.selectFrom('zone_de_developpement_prioritaire').select(['id_fcu', 'reseau_de_chaleur_ids']).execute();
      expect(pdp.reseau_de_chaleur_ids).toStrictEqual([1]);
      // a created entity is traced as a creation (by the admin, from the request), not as an update
      expect(await listEvents('network_created')).toStrictEqual([
        {
          author_id: testUsers.admin.id,
          context_id: String(pdp.id_fcu),
          context_type: 'perimetre_de_developpement_prioritaire',
          data: {
            id: String(pdp.id_fcu),
            // the perimeter is named after its linked network
            identifiant_reseau: '7501C',
            nom_reseau: null,
            request_id: id,
            request_kind: 'pdp',
            type: 'zone_de_developpement_prioritaire',
          },
          type: 'network_created',
        },
      ]);
      expect(await listEvents('network_updated')).toStrictEqual([]);
    });

    it('refuses a survey discrepancy: it is decided field by field on the FEDENE survey page', async () => {
      const { id } = await kdb
        .insertInto('network_change_requests')
        .values({
          contact_type: 'autre',
          kind: 'enquete',
          network_id: 1,
          network_label: '7501C - Réseau de test',
          network_type: 'reseau_de_chaleur',
          origin: 'import',
          payload: JSON.stringify({ gestionnaire: 'Dalkia (EDF)' }),
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      const caller = createTestCaller(testUsers.admin);

      await expect(caller.networkChangeRequests.admin.accept({ id })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('Enquête FEDENE'),
      });
      // not listed with the submitted requests, nor counted with them
      expect(await caller.networkChangeRequests.admin.list()).toStrictEqual([]);
      expect(await caller.networkChangeRequests.admin.countPending()).toStrictEqual(0);
    });

    it('accepts an « autre » request without applying anything', async () => {
      const { id } = await createTestCaller(null).networkChangeRequests.create({
        ...ficheInput,
        kind: 'autre',
        network: null,
        payload: { dansCadreDemandeADEME: false, precisions: 'Question' },
      });
      const caller = createTestCaller(testUsers.admin);

      await caller.networkChangeRequests.admin.accept({ id });

      expect(await caller.networkChangeRequests.admin.countPending()).toStrictEqual(0);
    });
  });
});
