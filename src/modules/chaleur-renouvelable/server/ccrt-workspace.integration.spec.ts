import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { defaultUserPreferences } from '@/modules/users/constants';
import { getUserPreferences, updateUserPreferences } from '@/modules/users/server/service';
import { serverConfig } from '@/server/config';
import { kdb } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { cleanDatabase, seedCommune, seedDemandeChaleurRenouvelable, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';
import { fetchJSON, postFetchJSON } from '@/utils/network';

import { EMPTY_BAT_ENR_INFO } from '../bat-enr';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  demandeChaleurRenouvelableProjectStates,
  zCcrtBuilding,
} from '../constants';
import * as ccrtNotesService from './ccrt-notes';
import { getAddressEligibilityContext, notifyCcrtOfUnhandledDemandesChaleurRenouvelable } from './service';

vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn() }));
vi.mock('@/utils/network', () => ({ fetchJSON: vi.fn(), postFetchJSON: vi.fn() }));
vi.mock('@/server/services/addresseInformation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/services/addresseInformation')>()),
  getEligilityStatus: vi.fn(),
}));
vi.mock('./service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./service')>()),
  getAddressEligibilityContext: vi.fn(),
}));

const heatNetworkEligibility = {
  co2: null,
  distance: null,
  futurNetwork: false,
  gestionnaire: null,
  hasNoTraceNetwork: false,
  hasPDP: false,
  id: null,
  inPDP: false,
  isClasse: false,
  isEligible: false,
  name: null,
  tauxENRR: null,
  veryEligibleDistance: null,
};

const addressEligibilityContext = {
  altitude: 0,
  batEnr: EMPTY_BAT_ENR_INFO,
  batEnrBatiments: [],
  codeDepartement: '13',
  eligibiliteReseauChaleur: heatNetworkEligibility,
  eligibiliteReseauFroid: null,
  isCcrtCovered: true,
  selectedBatEnrBatiment: undefined,
  shouldSelectBatEnrBatiment: false,
  temperatureRef: 0,
};

const emailContent = {
  body: 'Bonjour <script>\nMerci',
  cc: 'copie@example.fr',
  object: 'Suivi',
  replyTo: 'conseiller@example.fr',
  signature: 'Conseiller',
};
const notFound = { code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' };
const originalTracking = serverConfig.tracking;
afterEach(() => Object.assign(serverConfig, { tracking: originalTracking }));
const seedWorkspace = async () => {
  await seedTableUser([testUsers.admin, testUsers.ccrt, testUsers.alec]);
  await seedCommune({ insee_com: '13055', insee_dep: '13', insee_reg: '93', siren_epci: 'EPCI-13' });
  await kdb
    .insertInto('user_permissions')
    .values([
      { resource_id: '13', type: 'departement', user_id: testUsers.ccrt.id },
      { resource_id: 'EPCI-13', type: 'epci', user_id: testUsers.alec.id },
    ])
    .execute();
  return seedDemandeChaleurRenouvelable({
    commune_code: '13055',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    departement_code: '13',
    epci_code: 'EPCI-13',
    ept_code: 'EPT-13',
    id: uuid(500),
    region_code: '93',
    validated: true,
  });
};

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
  Object.assign(serverConfig, { tracking: { postHogApiHost: 'https://posthog.test', postHogKey: 'test' } });
  vi.mocked(postFetchJSON).mockResolvedValue(undefined);
  vi.mocked(getEligilityStatus).mockResolvedValue(heatNetworkEligibility);
  vi.mocked(sendEmailTemplate).mockResolvedValue(undefined);
  vi.mocked(fetchJSON).mockResolvedValue({
    features: [{ geometry: { coordinates: [5.37, 43.3] }, properties: { city: 'MARSEILLE', citycode: '13055', id: '13055_test' } }],
  });
  vi.mocked(getAddressEligibilityContext).mockResolvedValue(addressEligibilityContext);
});

describe('CCRT workspace access', () => {
  const permissionCases: TestCaseBoolean<(typeof testUsers)[keyof typeof testUsers] | null>[] = [
    { expectedOutput: false, input: null },
    ...Object.values(testUsers).map((user) => ({ expectedOutput: !['particulier', 'professionnel'].includes(user.role), input: user })),
  ];
  permissionCases.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`protects every workspace operation for ${user?.role ?? 'anonymous'}`, async () => {
      const demand = await seedWorkspace();
      if (user && ![testUsers.admin.id, testUsers.ccrt.id, testUsers.alec.id].includes(user.id)) {
        await seedTableUser([user]);
        await kdb.insertInto('user_permissions').values({ resource_id: '13', type: 'departement', user_id: user.id }).execute();
      }
      const route = createTestCaller(user).batEnr.ccrt;
      const calls = [
        () => route.getFollowUp({ demandId: demand.id }),
        () => route.getHeatNetworkEligibility({ demandId: demand.id }),
        () =>
          route.updateBuilding({ demandId: demand.id, updatedAt: demand.updated_at.toISOString(), values: zCcrtBuilding.parse(demand) }),
        () => route.sendEmail({ demandId: demand.id, emailContent, messageId: uuid(502) }),
        () =>
          route.updateDemandeChaleurRenouvelable({ demandId: demand.id, values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED } }),
      ];
      await calls.reduce(async (previous, call) => {
        await previous;
        if (allowed) {
          await expect(call()).resolves.toEqual(expect.any(Object));
        } else {
          await expect(call()).rejects.toMatchObject(forbiddenError);
        }
      }, Promise.resolve());
    });
  });

  it.each([
    ['commune', '13055'],
    ['epci', 'EPCI-13'],
    ['ept', 'EPT-13'],
    ['departement', '13'],
    ['region', '93'],
  ] as const)('uses %s permissions consistently for the list and individual actions', async (type, resource_id) => {
    const demand = await seedWorkspace();
    await kdb.deleteFrom('user_permissions').where('user_id', '=', testUsers.ccrt.id).execute();
    await kdb.insertInto('user_permissions').values({ resource_id, type, user_id: testUsers.ccrt.id }).execute();
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.getHeatNetworkEligibility({ demandId: demand.id })).resolves.toStrictEqual({
      coordinates: { lat: 43.3, lon: 5.37 },
      distance: null,
      isEligible: false,
    });
    const list = await createTestCaller(testUsers.ccrt).batEnr.ccrt.listDemandesChaleurRenouvelable();
    expect(list.items.map((item) => item.id)).toStrictEqual([demand.id]);
    await expect(
      createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        values: { note: 'Note partagée' },
      })
    ).resolves.toMatchObject({ id: demand.id });
  });

  it('denies all actions outside the territory or on unpublished demands', async () => {
    const demand = await seedWorkspace();
    await kdb.updateTable('demands_chaleur_renouvelable').set({ validated: false }).where('id', '=', demand.id).execute();
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id })).rejects.toMatchObject(notFound);
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.getHeatNetworkEligibility({ demandId: demand.id })).rejects.toMatchObject(
      notFound
    );
    expect(getEligilityStatus).not.toHaveBeenCalled();
    await expect(
      createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({ demandId: uuid(999), values: { note: 'Intrusion' } })
    ).rejects.toMatchObject(notFound);
  });
});

describe('CCRT notifications through classic permissions', () => {
  it.each([
    ['commune', '13055'],
    ['epci', 'EPCI-13'],
    ['ept', 'EPT-13'],
    ['departement', '13'],
    ['region', '93'],
  ] as const)('notifies and reminds only authorized active CCRT accounts through %s', async (type, resource_id) => {
    const demand = await seedWorkspace();
    await kdb.updateTable('demands_chaleur_renouvelable').set({ validated: false }).where('id', '=', demand.id).execute();
    await updateUserPreferences(testUsers.ccrt.id, { notifications: { pending_demands_reminder: true } });
    await kdb.deleteFrom('user_permissions').where('user_id', '=', testUsers.ccrt.id).execute();
    await seedTableUser([
      { active: false, email: 'inactive@test.local', id: uuid(800), role: 'ccrt' },
      { email: 'network-only@test.local', id: uuid(801), role: 'ccrt' },
    ]);
    await kdb
      .insertInto('user_permissions')
      .values([
        { resource_id, type, user_id: testUsers.ccrt.id },
        { resource_id: '93', type: 'region', user_id: uuid(800) },
        { resource_id: '13', type: 'reseau_de_chaleur', user_id: uuid(801) },
      ])
      .execute();
    const nearbyDemand = await seedDemandeChaleurRenouvelable({
      commune_code: '13056',
      created_at: new Date('2026-01-02T00:00:00.000Z'),
      departement_code: '13',
      epci_code: 'OTHER-EPCI',
      ept_code: 'OTHER-EPT',
      region_code: '93',
      validated: true,
    });
    await seedDemandeChaleurRenouvelable({
      commune_code: '75056',
      departement_code: '75',
      epci_code: 'PARIS-EPCI',
      region_code: '11',
      validated: true,
    });
    const pendingCount = type === 'region' || type === 'departement' ? 2 : 1;

    await createTestCaller(testUsers.admin).batEnr.admin.validateDemandeChaleurRenouvelable({ demandId: demand.id });
    expect(
      vi.mocked(sendEmailTemplate).mock.calls.map(([key, recipient, props]) => ({
        count: props && 'pendingDemandCount' in props ? props.pendingDemandCount : null,
        key,
        recipient,
      }))
    ).toStrictEqual([
      {
        count: pendingCount,
        key: 'demands.ccrt.nouvelle-demande-chaleur-renouvelable',
        recipient: { email: testUsers.ccrt.email, id: testUsers.ccrt.id },
      },
    ]);

    vi.mocked(sendEmailTemplate).mockClear();
    await notifyCcrtOfUnhandledDemandesChaleurRenouvelable();
    expect(
      vi.mocked(sendEmailTemplate).mock.calls.map(([key, recipient, props]) => ({
        count: props && 'pendingDemandCount' in props ? props.pendingDemandCount : null,
        key,
        props,
        recipient,
      }))
    ).toMatchObject([
      {
        count: pendingCount,
        key: 'demands.ccrt.rappel-demandes-en-attente',
        props: {
          demands: (pendingCount === 2 ? [demand.id, nearbyDemand.id] : [demand.id]).map((id) => ({ id })),
        },
        recipient: { email: testUsers.ccrt.email, id: testUsers.ccrt.id },
      },
    ]);
  });

  it.each(['daily', 'weekly', 'none'] as const)('does not send reminders when disabled, with new demands set to %s', async (frequency) => {
    await seedWorkspace();
    await updateUserPreferences(testUsers.ccrt.id, { notifications: { new_demands: frequency, pending_demands_reminder: false } });
    await notifyCcrtOfUnhandledDemandesChaleurRenouvelable();
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });
});

describe('CCRT assignment candidates', () => {
  const permissionCases: TestCaseBoolean<(typeof testUsers)[keyof typeof testUsers] | null>[] = [
    { expectedOutput: false, input: null },
    ...Object.values(testUsers).map((user) => ({ expectedOutput: user.role === 'admin', input: user })),
  ];
  permissionCases.forEach(({ input: user, expectedOutput: allowed }) => {
    it(`protects assignment candidates for ${user?.role ?? 'anonymous'}`, async () => {
      const demand = await seedWorkspace();
      const request = createTestCaller(user).batEnr.admin.listAssignmentCandidates({ demandId: demand.id });
      if (allowed) {
        expect((await request).map((candidate) => candidate.id)).toStrictEqual([testUsers.ccrt.id]);
      } else {
        await expect(request).rejects.toMatchObject(forbiddenError);
      }
    });
  });

  it.each([
    ['commune', '13055'],
    ['epci', 'EPCI-13'],
    ['ept', 'EPT-13'],
    ['departement', '13'],
    ['region', '93'],
  ] as const)('finds CCRT candidates covered by %s before publication', async (type, resource_id) => {
    const demand = await seedWorkspace();
    await kdb.updateTable('demands_chaleur_renouvelable').set({ validated: false }).where('id', '=', demand.id).execute();
    await kdb.deleteFrom('user_permissions').where('user_id', '=', testUsers.ccrt.id).execute();
    await kdb.insertInto('user_permissions').values({ resource_id, type, user_id: testUsers.ccrt.id }).execute();

    const candidates = await createTestCaller(testUsers.admin).batEnr.admin.listAssignmentCandidates({ demandId: demand.id });
    expect(candidates.map((candidate) => candidate.id)).toStrictEqual([testUsers.ccrt.id]);
  });

  it('deduplicates matching accounts and excludes inactive, unrelated and non-CCRT accounts', async () => {
    const demand = await seedWorkspace();
    await seedTableUser([
      { active: false, email: 'inactive-ccrt@test.local', id: uuid(800), role: 'ccrt' },
      { email: 'other-ccrt@test.local', id: uuid(801), role: 'ccrt' },
      { email: 'network-ccrt@test.local', id: uuid(802), role: 'ccrt' },
    ]);
    await kdb
      .insertInto('user_permissions')
      .values([
        { resource_id: '13055', type: 'commune', user_id: testUsers.ccrt.id },
        { resource_id: '13', type: 'departement', user_id: uuid(800) },
        { resource_id: '75', type: 'departement', user_id: uuid(801) },
        { resource_id: '13', type: 'reseau_de_chaleur', user_id: uuid(802) },
      ])
      .execute();

    const candidates = await createTestCaller(testUsers.admin).batEnr.admin.listAssignmentCandidates({ demandId: demand.id });
    expect(candidates.map((candidate) => candidate.id)).toStrictEqual([testUsers.ccrt.id]);
  });

  it('rejects a missing demand', async () => {
    await seedWorkspace();
    await expect(createTestCaller(testUsers.admin).batEnr.admin.listAssignmentCandidates({ demandId: uuid(999) })).rejects.toMatchObject(
      notFound
    );
  });
});

describe('CCRT heat-network eligibility', () => {
  it('reads eligibility at the address without changing saved simulation solutions', async () => {
    const demand = await seedWorkspace();
    vi.mocked(getEligilityStatus).mockResolvedValue({ ...heatNetworkEligibility, distance: 96, isEligible: true });
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.getHeatNetworkEligibility({ demandId: demand.id })).resolves.toStrictEqual({
      coordinates: { lat: 43.3, lon: 5.37 },
      distance: 96,
      isEligible: true,
    });
    expect(getEligilityStatus).toHaveBeenCalledWith(43.3, 5.37);
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['alternative_heating_solutions', 'updated_at'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(current).toStrictEqual({ alternative_heating_solutions: demand.alternative_heating_solutions, updated_at: demand.updated_at });
  });

  it('returns unknown eligibility when the address cannot be geocoded', async () => {
    const demand = await seedWorkspace();
    vi.mocked(fetchJSON).mockResolvedValue({ features: [] });
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.getHeatNetworkEligibility({ demandId: demand.id })).resolves.toBeNull();
    expect(getEligilityStatus).not.toHaveBeenCalled();
  });
});

describe('CCRT notes and shared history', () => {
  it.each(['admin', 'ccrt'] as const)('applies the same project-state reset and audit from %s', async (role) => {
    const demand = await seedWorkspace();
    const projectState = demandeChaleurRenouvelableProjectStates[1].label;
    await kdb
      .updateTable('demands_chaleur_renouvelable')
      .set({ project_state: projectState, status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION })
      .where('id', '=', demand.id)
      .execute();
    await createTestCaller(testUsers[role]).batEnr[role].updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED },
    });
    const followUp = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(followUp.history.map((event) => event.data)).toStrictEqual([
      {
        changes: {
          project_state: { from: projectState, to: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION },
          status: { from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION, to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED },
        },
      },
    ]);
    expect(vi.mocked(postFetchJSON).mock.calls.map(([, payload]) => payload)).toStrictEqual([
      expect.objectContaining({ properties: expect.objectContaining({ declenchement: 'manuel', type_statut: 'suivi' }) }),
      expect.objectContaining({ properties: expect.objectContaining({ declenchement: 'manuel', type_statut: 'avancement' }) }),
    ]);
  });

  it('keeps an automatic contact from overwriting a closed demand or adding a misleading audit', async () => {
    const demand = await seedWorkspace();
    await createTestCaller(testUsers.alec).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED },
    });
    const before = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    const result = await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      trigger: 'contact',
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
    });
    const after = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({ history: after.history, status: result.status }).toStrictEqual({
      history: before.history,
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED,
    });
  });

  it('saves the status and note together with both audit events', async () => {
    const demand = await seedWorkspace();
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { note: 'Premier échange', status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
    });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('status')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({
      events: followUp.history.map((event) => event.type).sort(),
      notes: followUp.notes.map((note) => note.body),
      status: current.status,
    }).toStrictEqual({
      events: ['ccrt_demand_note_created', 'ccrt_demand_updated'],
      notes: ['Premier échange'],
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
    });
    expect(vi.mocked(postFetchJSON).mock.calls.map(([, payload]) => payload)).toStrictEqual([
      expect.objectContaining({
        event: 'ccrt_demande:status_changed',
        properties: expect.objectContaining({
          declenchement: 'manuel',
          demande_id: demand.id,
          statut_apres: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
          statut_avant: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
          type_statut: 'suivi',
        }),
      }),
      expect.objectContaining({ event: 'ccrt_demande:internal_note_created' }),
    ]);
    expect(JSON.stringify(vi.mocked(postFetchJSON).mock.calls)).not.toContain('Premier échange');
  });

  it('rolls back the status and audit when the note cannot be inserted', async () => {
    const demand = await seedWorkspace();
    const insertNote = vi.spyOn(ccrtNotesService, 'insertCcrtNote').mockRejectedValueOnce(new Error('Note insertion failed'));
    try {
      await expect(
        createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
          demandId: demand.id,
          values: { note: 'Premier échange', status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT },
        })
      ).rejects.toThrow('Note insertion failed');
    } finally {
      insertNote.mockRestore();
    }
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('status')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({ events: followUp.history, notes: followUp.notes, status: current.status }).toStrictEqual({
      events: [],
      notes: [],
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
    });
    expect(postFetchJSON).not.toHaveBeenCalled();
  });

  it('adds a note without rewriting the demand or its concurrency token', async () => {
    const demand = await seedWorkspace();
    const result = await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { note: 'Première note', status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS },
    });
    const followUp = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({
      history: followUp.history.map((event) => event.type),
      notes: followUp.notes.map((note) => note.body),
      status: result.status,
      updatedAt: result.updated_at,
    }).toStrictEqual({
      history: ['ccrt_demand_note_created'],
      notes: ['Première note'],
      status: demand.status,
      updatedAt: demand.updated_at,
    });
  });

  it('lists all effective users and exposes only relevant permission changes in the audit', async () => {
    const demand = await seedWorkspace();
    await seedTableUser([{ ...testUsers.gestionnaire, active: false }, testUsers.particulier]);
    await kdb
      .insertInto('user_permissions')
      .values([
        { resource_id: '13', type: 'departement', user_id: testUsers.gestionnaire.id },
        { resource_id: '13', type: 'departement', user_id: testUsers.particulier.id },
      ])
      .execute();
    await createUserEvent({
      author_id: testUsers.admin.id,
      context_id: testUsers.alec.id,
      context_type: 'user',
      data: {
        added: [
          { resource_id: 'EPCI-13', type: 'epci' },
          { resource_id: '75', type: 'departement' },
        ],
        removed: [],
        user_email: testUsers.alec.email,
      },
      type: 'user_permissions_updated',
    });
    const result = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(result.users.map((user) => user.id).sort()).toStrictEqual([testUsers.admin.id, testUsers.alec.id, testUsers.ccrt.id].sort());
    expect(result.history.map((event) => ({ data: event.data, type: event.type }))).toStrictEqual([
      {
        data: { added: [{ resource_id: 'EPCI-13', type: 'epci' }], removed: [], user_email: testUsers.alec.email },
        type: 'user_permissions_updated',
      },
    ]);
  });

  it('shares archive/reopening and records changes made from the existing admin screen', async () => {
    const demand = await seedWorkspace();
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED },
    });
    const list = await createTestCaller(testUsers.alec).batEnr.ccrt.listDemandesChaleurRenouvelable();
    expect(list.items.map((item) => item.status)).toStrictEqual([DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED]);
    await createTestCaller(testUsers.admin).batEnr.admin.updateDemandeChaleurRenouvelable({
      demandId: demand.id,
      values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS },
    });
    const followUp = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(followUp.history.map((event) => event.data)).toStrictEqual([
      { changes: { status: { from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED, to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } } },
      { changes: { status: { from: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS, to: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED } } },
    ]);
  });
});

describe('CCRT email delivery', () => {
  it.each([true, false])('sends once, archives the message and honors updateStatusOnSend=%s', async (updateStatusOnSend) => {
    const demand = await seedWorkspace();
    const preferences = { ...defaultUserPreferences, notifications: { new_demands: 'weekly', pending_demands_reminder: false } } as const;
    await kdb
      .updateTable('users')
      .set({ preferences: JSON.stringify(preferences) })
      .where('id', '=', testUsers.ccrt.id)
      .execute();
    const input = { demandId: demand.id, emailContent, messageId: uuid(510), updateStatusOnSend };
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail(input);
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail(input);
    expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual([
      [
        'demands.demandeur.message-gestionnaire',
        { email: demand.email, id: demand.id },
        { content: 'Bonjour &lt;script&gt;<br />Merci', signature: emailContent.signature },
        { cc: ['copie@example.fr'], replyTo: emailContent.replyTo, subject: emailContent.object },
      ],
    ]);
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('status')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(current).toStrictEqual({
      status: updateStatusOnSend ? DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT : DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
    });
    const followUp = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(followUp.emails.map((email) => ({ body: email.body, id: email.id, to: email.to }))).toStrictEqual([
      { body: emailContent.body, id: input.messageId, to: demand.email },
    ]);
    const captures = vi.mocked(postFetchJSON).mock.calls.map(([, payload]) => payload);
    expect(captures).toHaveLength(updateStatusOnSend ? 2 : 1);
    expect(captures).toContainEqual(expect.objectContaining({ event: 'ccrt_demande:email_sent' }));
    if (updateStatusOnSend) {
      expect(captures).toContainEqual(
        expect.objectContaining({
          event: 'ccrt_demande:status_changed',
          properties: expect.objectContaining({ declenchement: 'auto', type_statut: 'suivi' }),
        })
      );
    }
    expect(JSON.stringify(captures)).not.toContain(demand.email);
    await expect(getUserPreferences(testUsers.ccrt.id)).resolves.toStrictEqual({ ...preferences, email_signature: emailContent.signature });
    const preferenceEvents = await kdb
      .selectFrom('events')
      .select('data')
      .where('context_id', '=', testUsers.ccrt.id)
      .where('type', '=', 'user_preferences_updated')
      .execute();
    expect(preferenceEvents).toStrictEqual([{ data: { changes: { email_signature: emailContent.signature } } }]);
  });

  it('preserves the status/history on SMTP failure and allows one explicit retry', async () => {
    const demand = await seedWorkspace();
    const input = { demandId: demand.id, emailContent, messageId: uuid(511) };
    vi.mocked(sendEmailTemplate).mockRejectedValueOnce(new Error('SMTP failure'));
    await expect(createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail(input)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    const failed = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({ emails: failed.emails, history: failed.history }).toStrictEqual({ emails: [], history: [] });
    expect(postFetchJSON).not.toHaveBeenCalled();
    await expect(getUserPreferences(testUsers.ccrt.id)).resolves.toStrictEqual(defaultUserPreferences);
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail(input);
    expect(vi.mocked(sendEmailTemplate).mock.calls.length).toStrictEqual(2);
  });

  it('does not overwrite a concurrently closed demand when sending', async () => {
    const demand = await seedWorkspace();
    vi.mocked(sendEmailTemplate).mockImplementationOnce(async () => {
      await createTestCaller(testUsers.alec).batEnr.ccrt.updateDemandeChaleurRenouvelable({
        demandId: demand.id,
        values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED },
      });
    });
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.sendEmail({ demandId: demand.id, emailContent, messageId: uuid(512) });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('status')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(current).toStrictEqual({ status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_CLOSED });
  });
});

describe('CCRT building corrections', () => {
  it.each([
    { next: '', previous: null },
    { next: null, previous: '' },
    { next: '\t', previous: '   ' },
  ])('audits only real changes when missing refusal details change representation ($previous → $next)', async ({ previous, next }) => {
    const demand = await seedWorkspace();
    await kdb
      .updateTable('demands_chaleur_renouvelable')
      .set({ refusal_period: previous, refusal_reason: previous })
      .where('id', '=', demand.id)
      .execute();

    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values: { ...zCcrtBuilding.parse(demand), refusal_period: next, refusal_reason: next, surface_area: 145 },
    });

    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['refusal_period', 'refusal_reason', 'surface_area'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect({ changes: followUp.history.map((event) => event.data), current }).toStrictEqual({
      changes: [{ changes: { surface_area: { from: null, to: 145 } } }],
      current: { refusal_period: null, refusal_reason: null, surface_area: 145 },
    });
    expect(postFetchJSON).toHaveBeenCalledExactlyOnceWith(
      'https://posthog.test/capture/',
      expect.objectContaining({
        properties: expect.objectContaining({ champs_modifies: ['surface_area'], nb_champs_modifies: 1 }),
      })
    );
  });

  it('does not create an audit or tracking event for equivalent missing refusal details alone', async () => {
    const demand = await seedWorkspace();
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values: { ...zCcrtBuilding.parse(demand), refusal_period: '', refusal_reason: '' },
    });
    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(followUp.history).toStrictEqual([]);
    expect(postFetchJSON).not.toHaveBeenCalled();
  });

  it('preserves read-only identification and original declarations even when submitted with a correction', async () => {
    const demand = await seedWorkspace();
    const readOnlyValues = {
      address: demand.address,
      comments: null,
      project_status: demand.project_status,
      rnic_nom_copropriete: 'Copropriété initiale',
      rnic_numero_immatriculation: 'AA0000000',
      rnic_siret_representant_legal: '12345678901234',
    };
    await kdb.updateTable('demands_chaleur_renouvelable').set(readOnlyValues).where('id', '=', demand.id).execute();
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values: {
        ...zCcrtBuilding.parse(demand),
        ...Object.fromEntries(Object.keys(readOnlyValues).map((field) => [field, 'Remplacement interdit'])),
        dpe: 'D',
      },
    });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select([
        'address',
        'comments',
        'project_status',
        'rnic_nom_copropriete',
        'rnic_numero_immatriculation',
        'rnic_siret_representant_legal',
      ])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    const followUp = await createTestCaller(testUsers.alec).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect({ changes: followUp.history.map((event) => event.data), current }).toStrictEqual({
      changes: [{ changes: { dpe: { from: 'E', to: 'D' } } }],
      current: readOnlyValues,
    });
    expect(vi.mocked(fetchJSON).mock.calls[0][1]).toMatchObject({ params: { q: demand.address } });
    expect(postFetchJSON).toHaveBeenCalledExactlyOnceWith('https://posthog.test/capture/', {
      api_key: 'test',
      distinct_id: testUsers.ccrt.id,
      event: 'ccrt_demande:building_data_edited',
      properties: {
        $process_person_profile: false,
        champs_modifies: ['dpe'],
        demande_id: demand.id,
        departement: '13',
        nb_champs_modifies: 1,
        solution_1: demand.alternative_heating_solutions[0] ?? null,
        source: 'ccrt_workspace',
        structure_ccrt: null,
      },
    });
  });

  it('keeps an eligible heat network out of the saved alternative solutions', async () => {
    const demand = await seedWorkspace();
    vi.mocked(getAddressEligibilityContext).mockResolvedValue({
      ...addressEligibilityContext,
      eligibiliteReseauChaleur: { ...heatNetworkEligibility, distance: 50, isEligible: true },
    });
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values: { ...zCcrtBuilding.parse(demand), outdoor_space: 'jardinCours', radiator_type: 'radiateur-eau' },
    });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select('alternative_heating_solutions')
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(current.alternative_heating_solutions.length).toStrictEqual(3);
    expect(current.alternative_heating_solutions).not.toContain('Réseau de chaleur');
  });

  it('preserves decimal residents in storage and the result URL across consecutive corrections', async () => {
    const demand = await seedWorkspace();
    const values = { ...zCcrtBuilding.parse(demand), average_residents: 2.5 };
    const firstSave = await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values,
    });
    const secondSave = await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: firstSave.updatedAt,
      values: { ...values, average_residents: 2.7 },
    });
    const corrected = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['average_residents', 'simulation_url', 'updated_at'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect({
      queryResidents: new URL(corrected.simulation_url, 'https://test.local').searchParams.get('habitantsMoyen'),
      residents: corrected.average_residents,
      updatedAt: corrected.updated_at.toISOString(),
    }).toStrictEqual({ queryResidents: '2.7', residents: 2.7, updatedAt: secondSave.updatedAt });
  });

  it('keeps unknown hot water explicit in the result URL instead of defaulting it to collective', async () => {
    const demand = await seedWorkspace();
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values: zCcrtBuilding.parse(demand),
    });
    const corrected = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['simulation_url', 'hot_water_system_type'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect({
      mode: corrected.hot_water_system_type,
      queryMode: new URL(corrected.simulation_url, 'https://test.local').searchParams.get('modeEauChaudeSanitaire'),
    }).toStrictEqual({ mode: null, queryMode: 'nonRenseigne' });
    expect(postFetchJSON).not.toHaveBeenCalled();
  });

  it('recomputes a coherent result URL/ranking, audits corrections and rejects a stale editor', async () => {
    const demand = await seedWorkspace();
    const values = {
      ...zCcrtBuilding.parse(demand),
      dpe: 'D' as const,
      housing_count: 1,
      housing_type: 'maison_individuelle' as const,
      outdoor_space: 'jardinCours' as const,
    };
    await createTestCaller(testUsers.ccrt).batEnr.ccrt.updateBuilding({
      demandId: demand.id,
      updatedAt: demand.updated_at.toISOString(),
      values,
    });
    const current = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['housing_type', 'alternative_heating_solutions', 'simulation_url'])
      .where('id', '=', demand.id)
      .executeTakeFirstOrThrow();
    expect(current.housing_type).toStrictEqual('maison_individuelle');
    expect(current.alternative_heating_solutions.length).toStrictEqual(3);
    expect(current.alternative_heating_solutions).not.toStrictEqual(demand.alternative_heating_solutions);
    const params = new URL(current.simulation_url, 'https://test.local').searchParams;
    expect({
      dpe: params.get('dpe'),
      espaceExterieur: params.get('espaceExterieur'),
      nbLogements: params.get('nbLogements'),
      typeLogement: params.get('typeLogement'),
    }).toStrictEqual({ dpe: 'D', espaceExterieur: 'jardinCours', nbLogements: '1', typeLogement: 'maison_individuelle' });
    await expect(
      createTestCaller(testUsers.alec).batEnr.ccrt.updateBuilding({
        demandId: demand.id,
        updatedAt: demand.updated_at.toISOString(),
        values,
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(postFetchJSON).toHaveBeenCalledTimes(1);
    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });
    expect(followUp.history.map((event) => event.data)).toStrictEqual([
      {
        changes: {
          dpe: { from: 'E', to: 'D' },
          housing_count: { from: 25, to: 1 },
          housing_type: { from: 'immeuble_chauffage_collectif', to: 'maison_individuelle' },
          outdoor_space: { from: 'none', to: 'jardinCours' },
        },
      },
    ]);
  });
});
