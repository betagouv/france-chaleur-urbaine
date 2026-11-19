import type { User } from 'next-auth';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvents } from '@/modules/events/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCase, testUsers } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import type { NetworkTrackingState } from '../constants';
import { getParentNetworkId } from './network-tracking';

const NOW = new Date('2026-10-15T10:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const adminId = testUsers.admin.id;
const gestionnaireId = testUsers.gestionnaire.id;
const collectiviteId = testUsers.collectivite.id;
const organizationId = uuid(60);

const day = (isoDay: string) => new Date(`${isoDay}T10:00:00.000Z`);
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

type SeedDemandValues = {
  status: DEMANDE_STATUS;
  demandDate: Date;
  extensionId?: number;
  networkId?: number | null;
  networkType?: NetworkType | null;
  validated?: boolean;
  deletedAt?: Date | null;
};

const seedDemand = (index: number, values: SeedDemandValues) =>
  kdb
    .insertInto('demands')
    .values({
      deleted_at: values.deletedAt ?? null,
      extension_id: values.extensionId ?? null,
      id: uuid(index),
      legacy_values: JSON.stringify({
        Adresse: '10 Rue de Rivoli 75001 Paris',
        'Date de la demande': values.demandDate.toISOString(),
        Logement: 25,
        Mail: 'demandeur@example.fr',
        Status: values.status,
      }),
      network_id: values.networkId === undefined ? 1 : values.networkId,
      network_type: values.networkType === undefined ? 'reseau_de_chaleur' : values.networkType,
      validated: values.validated ?? true,
    })
    .execute();

type SeedEventValues = Pick<Parameters<typeof createEvents>[0][number], 'type' | 'created_at'> & {
  demand: number;
  authorId?: string;
  data?: Record<string, string>;
};

const seedEvents = (events: SeedEventValues[]) =>
  createEvents(
    events.map((event) => ({
      author_id: event.authorId ?? null,
      context_id: uuid(event.demand),
      context_type: 'demand',
      created_at: event.created_at,
      data: JSON.stringify(event.data ?? {}),
      type: event.type,
    }))
  );

const seedUsers = () =>
  seedTableUser([
    { id: adminId, role: 'admin' },
    { id: gestionnaireId, last_connection: null, role: 'gestionnaire' },
    { id: collectiviteId, last_connection: null, role: 'collectivite' },
  ]);

/**
 * Network A has a manager, a reminder and notes; network C has no demand, a manager also in its organization and an account only in its organization;
 * network B shares its id with A but not its type.
 */
const seedNetworks = async () => {
  await kdb.insertInto('organizations').values({ id: organizationId, name: 'Opérateur C' }).execute();
  await Promise.all([
    seedReseauDeChaleur({
      'Identifiant reseau': '7501C',
      id_fcu: 1,
      nom_reseau: 'Réseau A',
      notes: 'Contact difficile',
      ouvert_aux_raccordements: true,
      puissance_totale_MW: 12.5,
    }),
    seedReseauDeChaleur({ id_fcu: 2, nom_reseau: 'Réseau C', organization_id: organizationId, ouvert_aux_raccordements: true }),
    seedZoneEtReseauEnConstruction({ id_fcu: 1, nom_reseau: 'Réseau B', ouvert_aux_raccordements: true }),
  ]);
  await kdb
    .insertInto('user_permissions')
    .values([
      { resource_id: '1', type: 'reseau_de_chaleur', user_id: gestionnaireId },
      // an admin never processes demands, even with a permission on the network
      { resource_id: '1', type: 'reseau_de_chaleur', user_id: adminId },
      { resource_id: organizationId, type: 'organization', user_id: collectiviteId },
      // a manager of the network can also belong to its organization: listed in both
      { resource_id: organizationId, type: 'organization', user_id: gestionnaireId },
      { resource_id: '2', type: 'reseau_de_chaleur', user_id: gestionnaireId },
    ])
    .execute();
  await kdb
    .insertInto('network_reminders')
    .values([
      { author_id: adminId, id: uuid(50), network_id: 1, network_type: 'reseau_de_chaleur', note: 'Relancé par courriel', type: 'demand' },
      // a reminder about the network geometry belongs to another screen
      { author_id: adminId, id: uuid(51), network_id: 1, network_type: 'reseau_de_chaleur', note: 'Tracé à revoir', type: 'trace' },
    ])
    .execute();
};

/** Network A: one answered demand, one pending, one reassigned then answered through the API, one older than the audit log, one created unrealisable. */
const seedTrackedDemands = async () => {
  await Promise.all([
    seedDemand(1, { demandDate: day('2026-08-30'), status: DEMANDE_STATUS.RECONTACTED }),
    seedDemand(2, { demandDate: day('2026-09-09'), status: DEMANDE_STATUS.TO_PROCESS }),
    seedDemand(3, { demandDate: day('2026-07-30'), status: DEMANDE_STATUS.UNREALISABLE }),
    seedDemand(4, { demandDate: day('2024-05-01'), status: DEMANDE_STATUS.RECONTACTED }),
    seedDemand(5, { demandDate: day('2026-09-01'), status: DEMANDE_STATUS.TO_PROCESS, validated: false }),
    seedDemand(6, { deletedAt: day('2026-09-02'), demandDate: day('2026-09-01'), status: DEMANDE_STATUS.TO_PROCESS }),
    seedDemand(7, { demandDate: day('2026-09-01'), networkId: null, networkType: null, status: DEMANDE_STATUS.TO_PROCESS }),
    seedDemand(8, { demandDate: day('2026-03-01'), networkType: 'reseau_en_construction', status: DEMANDE_STATUS.DONE }),
    seedDemand(9, { demandDate: day('2026-09-12'), status: DEMANDE_STATUS.UNREALISABLE }),
  ]);
  await seedEvents([
    { authorId: adminId, created_at: day('2026-09-01'), demand: 1, type: 'demand_validated' },
    {
      authorId: gestionnaireId,
      created_at: day('2026-09-04'),
      data: { Status: DEMANDE_STATUS.RECONTACTED },
      demand: 1,
      type: 'demand_updated',
    },
    { authorId: adminId, created_at: day('2026-09-10'), demand: 2, type: 'demand_validated' },
    // an admin update is not a manager action
    { authorId: adminId, created_at: day('2026-09-11'), data: { comment_fcu: 'à relancer' }, demand: 2, type: 'demand_updated' },
    { authorId: adminId, created_at: day('2026-08-01'), demand: 3, type: 'demand_validated' },
    // action of the previous network, before the reassignment
    {
      authorId: gestionnaireId,
      created_at: day('2026-08-02'),
      data: { Status: DEMANDE_STATUS.RECONTACTED },
      demand: 3,
      type: 'demand_updated',
    },
    { authorId: adminId, created_at: day('2026-09-20'), demand: 3, type: 'demand_assignment_changed' },
    { created_at: day('2026-09-21'), data: { statut: DEMANDE_STATUS.UNREALISABLE }, demand: 3, type: 'api_demand_updated' },
    { authorId: adminId, created_at: day('2026-03-02'), demand: 8, type: 'demand_validated' },
    // an ineligible demand is created unrealisable: validated, never awaiting a response
    { authorId: adminId, created_at: day('2026-09-13'), demand: 9, type: 'demand_validated' },
    { authorId: collectiviteId, created_at: day('2026-03-03'), demand: 8, type: 'demand_email_sent' },
  ]);
};

/** Expected summary of a network without any demand, the starting point of every expected summary. */
const emptySummary = {
  closed: 0,
  extensions: [],
  inProgress: 0,
  lastManagerActionAt: null,
  managers: [],
  medianResponseDays: null,
  newestDemandAt: null,
  newestPendingDemandAt: null,
  notes: null,
  oldestDemandAt: null,
  oldestPendingDemandAt: null,
  organization: null,
  pending: 0,
  powerMW: null,
  recentReceived: 0,
  recentResponded: 0,
  reminders: [],
  sncuId: null,
  state: 'no_demand',
  total: 0,
};

const accountOf = (id: string) => ({ email: `user-${id}@test.local`, email_blocked_reason: null, id, last_connection: null });
const gestionnaireAccount = accountOf(gestionnaireId);

const networkAIdentity = {
  managers: [gestionnaireAccount],
  name: 'Réseau A',
  networkId: 1,
  networkType: 'reseau_de_chaleur',
  notes: 'Contact difficile',
  powerMW: 12.5,
  reminders: [{ author_email: `user-${adminId}@test.local`, created_at: expect.any(String), id: uuid(50), note: 'Relancé par courriel' }],
  sncuId: '7501C',
};
const networkCIdentity = {
  managers: [gestionnaireAccount],
  name: 'Réseau C',
  networkId: 2,
  networkType: 'reseau_de_chaleur',
  organization: { id: organizationId, name: 'Opérateur C' },
};
const networkBIdentity = { name: 'Réseau B', networkId: 1, networkType: 'reseau_en_construction' };

const networkASummary = {
  ...emptySummary,
  ...networkAIdentity,
  closed: 2,
  inProgress: 2,
  lastManagerActionAt: day('2026-09-21'),
  medianResponseDays: 2,
  newestDemandAt: day('2026-09-12'),
  newestPendingDemandAt: day('2026-09-09'),
  oldestDemandAt: day('2024-05-01'),
  oldestPendingDemandAt: day('2026-09-09'),
  pending: 1,
  recentReceived: 3,
  recentResponded: 2,
  state: 'late',
  total: 5,
};

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

const permissionTests: PermissionTestCase[] = [
  { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
  { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
  { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
  { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
  { allowed: false, label: 'refuse collectivité', user: testUsers.collectivite },
  { allowed: true, label: 'autorise admin', user: testUsers.admin },
];

describe('network tracking', () => {
  beforeAll(() => {
    // Date only: the pg pool relies on real timers
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.setSystemTime(NOW);
    await cleanDatabase();
    await kdb.deleteFrom('organizations').execute();
    await seedUsers();
    await seedNetworks();
  });

  describe('listNetworkTracking', () => {
    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const callRoute = () => createTestCaller(user).demands.admin.listNetworkTracking();

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual([
          { ...emptySummary, ...networkAIdentity },
          { ...emptySummary, ...networkCIdentity },
          { ...emptySummary, ...networkBIdentity },
        ]);
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('derives the indicators of each network from the audit log', async () => {
      await seedTrackedDemands();

      const result = await createTestCaller(testUsers.admin).demands.admin.listNetworkTracking();

      expect(result).toStrictEqual([
        networkASummary,
        { ...emptySummary, ...networkCIdentity },
        {
          ...emptySummary,
          ...networkBIdentity,
          closed: 1,
          lastManagerActionAt: day('2026-03-03'),
          medianResponseDays: 1,
          newestDemandAt: day('2026-03-01'),
          oldestDemandAt: day('2026-03-01'),
          recentReceived: 1,
          recentResponded: 1,
          state: 'up_to_date',
          total: 1,
        },
      ]);
    });

    it('tracks an extension linked to a heat network with its parent network, which carries its demands', async () => {
      await seedZoneEtReseauEnConstruction({
        id_fcu: 5,
        mise_en_service: '2027',
        nom_reseau: 'Réseau C',
        ouvert_aux_raccordements: true,
        reseau_de_chaleur_id: 2,
      });
      await seedDemand(20, { demandDate: day('2026-10-10'), extensionId: 5, networkId: 2, status: DEMANDE_STATUS.TO_PROCESS });

      const result = await createTestCaller(testUsers.admin).demands.admin.listNetworkTracking();

      expect(result).toStrictEqual([
        { ...emptySummary, ...networkAIdentity },
        {
          ...emptySummary,
          ...networkCIdentity,
          extensions: [{ id_fcu: 5, mise_en_service: '2027' }],
          newestDemandAt: day('2026-10-10'),
          newestPendingDemandAt: day('2026-10-10'),
          oldestDemandAt: day('2026-10-10'),
          oldestPendingDemandAt: day('2026-10-10'),
          pending: 1,
          state: 'up_to_date',
          total: 1,
        },
        { ...emptySummary, ...networkBIdentity },
      ]);
    });

    const stateCases: TestCase<{ pendingDays: number | null; lastActionDays: number | null }, NetworkTrackingState>[] = [
      { expectedOutput: 'up_to_date', input: { lastActionDays: null, pendingDays: null }, label: 'no pending demand → up to date' },
      { expectedOutput: 'up_to_date', input: { lastActionDays: null, pendingDays: 10 }, label: 'pending for 10 days → up to date' },
      { expectedOutput: 'late', input: { lastActionDays: 20, pendingDays: 40 }, label: 'pending for 40 days, action 20 days ago → late' },
      {
        expectedOutput: 'silent',
        input: { lastActionDays: 100, pendingDays: 40 },
        label: 'pending for 40 days, action 100 days ago → silent',
      },
      { expectedOutput: 'silent', input: { lastActionDays: null, pendingDays: 40 }, label: 'pending for 40 days, no action → silent' },
    ];

    it.each(stateCases)('$label', async ({ input, expectedOutput }) => {
      await seedDemand(1, { demandDate: daysAgo(200), status: DEMANDE_STATUS.DONE });
      await seedEvents([{ authorId: adminId, created_at: daysAgo(200), demand: 1, type: 'demand_validated' }]);
      if (input.lastActionDays !== null) {
        await seedEvents([{ authorId: gestionnaireId, created_at: daysAgo(input.lastActionDays), demand: 1, type: 'demand_updated' }]);
      }
      if (input.pendingDays !== null) {
        await seedDemand(2, { demandDate: daysAgo(input.pendingDays), status: DEMANDE_STATUS.TO_PROCESS });
        await seedEvents([{ authorId: adminId, created_at: daysAgo(input.pendingDays), demand: 2, type: 'demand_validated' }]);
      }

      const result = await createTestCaller(testUsers.admin).demands.admin.listNetworkTracking();

      expect(result.map((network) => network.state)).toStrictEqual([expectedOutput, 'no_demand', 'no_demand']);
    });
  });

  describe('getParentNetworkId', () => {
    const cases: TestCase<Parameters<typeof getParentNetworkId>[0], number | null>[] = [
      { expectedOutput: 2, input: { networkId: 5, networkType: 'reseau_en_construction' }, label: 'linked extension → its parent network' },
      {
        expectedOutput: null,
        input: { networkId: 1, networkType: 'reseau_en_construction' },
        label: 'standalone network under construction',
      },
      { expectedOutput: null, input: { networkId: 2, networkType: 'reseau_de_chaleur' }, label: 'heat network' },
      { expectedOutput: null, input: { networkId: 99, networkType: 'reseau_en_construction' }, label: 'unknown network' },
    ];
    it.each(cases)('$label', async ({ input, expectedOutput }) => {
      await seedZoneEtReseauEnConstruction({ id_fcu: 5, ouvert_aux_raccordements: true, reseau_de_chaleur_id: 2 });

      expect(await getParentNetworkId(input)).toStrictEqual(expectedOutput);
    });
  });

  describe('getNetworkTracking', () => {
    const input = { networkId: 1, networkType: 'reseau_de_chaleur' } as const;
    // from the start of the audit log to the frozen current month
    const activityMonths = [
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const callRoute = () => createTestCaller(user).demands.admin.getNetworkTracking({ ...input, networkId: 999 });

      await expect(callRoute).rejects.toMatchObject(allowed ? { code: 'NOT_FOUND', message: 'Réseau introuvable' } : forbiddenError);
    });

    it('returns an empty detail for a network without any demand', async () => {
      const result = await createTestCaller(testUsers.admin).demands.admin.getNetworkTracking({ ...input, networkId: 2 });

      expect(result).toStrictEqual({
        months: activityMonths.map((month) => ({ handled: 0, month, received: 0 })),
        organization: {
          hasApiAccess: false,
          id: organizationId,
          name: 'Opérateur C',
          users: [gestionnaireAccount, accountOf(collectiviteId)],
        },
        quarters: [],
        statuses: [],
        summary: { ...emptySummary, ...networkCIdentity },
      });
    });

    const apiAccessCases: TestCase<(Date | null)[], boolean>[] = [
      { expectedOutput: false, input: [day('2026-09-01')], label: 'a revoked credential grants no access' },
      { expectedOutput: true, input: [day('2026-09-01'), null], label: 'an active credential grants access' },
    ];

    it.each(apiAccessCases)('organization API access: $label', async ({ input: revokedDates, expectedOutput }) => {
      await kdb
        .insertInto('organization_api_credentials')
        .values(
          revokedDates.map((revokedAt, index) => ({ organization_id: organizationId, revoked_at: revokedAt, token_hash: `hash-${index}` }))
        )
        .execute();

      const result = await createTestCaller(testUsers.admin).demands.admin.getNetworkTracking({ ...input, networkId: 2 });

      expect(result.organization?.hasApiAccess).toBe(expectedOutput);
    });

    const activityWindowCases: TestCase<string, { count: number; first: string; last: string }>[] = [
      {
        expectedOutput: { count: 18, first: '2026-02', last: '2027-07' },
        input: '2027-07-15T10:00:00.000Z',
        label: 'in summer time, the window starts 17 months earlier in winter time',
      },
      {
        expectedOutput: { count: 18, first: '2026-07', last: '2027-12' },
        input: '2027-12-15T10:00:00.000Z',
        label: 'in winter time, the window starts 17 months earlier in summer time',
      },
      {
        expectedOutput: { count: 18, first: '2026-02', last: '2027-07' },
        input: '2027-06-30T22:30:00.000Z',
        label: 'the first minutes of a month in Paris are still the previous month in UTC',
      },
    ];

    it.each(activityWindowCases)('activity window: $label', async ({ input: now, expectedOutput }) => {
      vi.setSystemTime(new Date(now));

      const result = await createTestCaller(testUsers.admin).demands.admin.getNetworkTracking({ ...input, networkId: 2 });

      const months = result.months.map((month) => month.month);
      expect({ count: months.length, first: months[0], last: months.at(-1) }).toStrictEqual(expectedOutput);
    });

    it('details the activity, the response by quarter and the statuses of a network', async () => {
      await seedTrackedDemands();

      const result = await createTestCaller(testUsers.admin).demands.admin.getNetworkTracking(input);

      expect(result).toStrictEqual({
        months: activityMonths.map((month) =>
          month === '2026-09' ? { handled: 2, month, received: 4 } : { handled: 0, month, received: 0 }
        ),
        organization: null,
        quarters: [{ medianResponseDays: 2, quarter: '2026-T3', received: 3, responded: 2 }],
        statuses: [
          { count: 1, medianAgeDays: 35, status: DEMANDE_STATUS.TO_PROCESS, stuckCount: 0 },
          // demand 3 changed 24 days ago; demand 9 never changed, so it counts from its reception 32 days ago
          { count: 2, medianAgeDays: 28, status: DEMANDE_STATUS.UNREALISABLE, stuckCount: 0 },
          // demand 4 has no recorded change: counted from the start of the audit log (2025-12-01, Paris time)
          { count: 2, medianAgeDays: 179.7, status: DEMANDE_STATUS.RECONTACTED, stuckCount: 1 },
        ],
        summary: networkASummary,
      });
    });
  });
});
