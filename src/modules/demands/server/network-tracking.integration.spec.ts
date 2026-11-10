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

const NOW = new Date('2026-10-15T10:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const adminId = testUsers.admin.id;
const gestionnaireId = testUsers.gestionnaire.id;
const collectiviteId = testUsers.collectivite.id;

const day = (isoDay: string) => new Date(`${isoDay}T10:00:00.000Z`);
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

type SeedDemandValues = {
  status: DEMANDE_STATUS;
  demandDate: Date;
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
    { id: gestionnaireId, role: 'gestionnaire' },
    { id: collectiviteId, role: 'collectivite' },
  ]);

const seedNetworks = () =>
  Promise.all([
    seedReseauDeChaleur({
      Gestionnaire: 'Opérateur A',
      'Identifiant reseau': '7501C',
      id_fcu: 1,
      nom_reseau: 'Réseau A',
      ouvert_aux_raccordements: true,
    }),
    // same id as the heat network: the network type is part of the key
    seedZoneEtReseauEnConstruction({ gestionnaire: 'Opérateur B', id_fcu: 1, nom_reseau: 'Réseau B', ouvert_aux_raccordements: true }),
  ]);

/** Network A: one answered demand, one pending, one reassigned then answered through the API, one older than the audit log. */
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
    { authorId: collectiviteId, created_at: day('2026-03-03'), demand: 8, type: 'demand_email_sent' },
  ]);
};

const networkASummary = {
  closed: 1,
  gestionnaire: 'Opérateur A',
  inProgress: 2,
  lastManagerActionAt: day('2026-09-21'),
  medianResponseDays: 2,
  name: 'Réseau A',
  networkId: 1,
  networkType: 'reseau_de_chaleur',
  oldestPendingSince: day('2026-09-10'),
  pending: 1,
  recentReceived: 3,
  recentResponded: 2,
  sncuId: '7501C',
  state: 'late',
  total: 4,
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
    await cleanDatabase();
    await seedUsers();
    await seedNetworks();
  });

  describe('listNetworkTracking', () => {
    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const callRoute = () => createTestCaller(user).demands.admin.listNetworkTracking();

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual([]);
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('derives the indicators of each network from the audit log', async () => {
      await seedTrackedDemands();

      const result = await createTestCaller(testUsers.admin).demands.admin.listNetworkTracking();

      expect(result).toStrictEqual([
        networkASummary,
        {
          closed: 1,
          gestionnaire: 'Opérateur B',
          inProgress: 0,
          lastManagerActionAt: day('2026-03-03'),
          medianResponseDays: 1,
          name: 'Réseau B',
          networkId: 1,
          networkType: 'reseau_en_construction',
          oldestPendingSince: null,
          pending: 0,
          recentReceived: 1,
          recentResponded: 1,
          sncuId: null,
          state: 'up_to_date',
          total: 1,
        },
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

      expect(result.map((network) => network.state)).toStrictEqual([expectedOutput]);
    });
  });

  describe('getNetworkTracking', () => {
    const input = { networkId: 1, networkType: 'reseau_de_chaleur' } as const;

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const callRoute = () => createTestCaller(user).demands.admin.getNetworkTracking(input);

      await expect(callRoute).rejects.toMatchObject(
        allowed ? { code: 'NOT_FOUND', message: 'Aucune demande validée pour ce réseau' } : forbiddenError
      );
    });

    it('details the activity, the response by quarter and the statuses of a network', async () => {
      await seedTrackedDemands();

      const result = await createTestCaller(testUsers.admin).demands.admin.getNetworkTracking(input);

      const quietMonths = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
      expect(result).toStrictEqual({
        months: [
          ...quietMonths.map((month) => ({ handled: 0, month, received: 0 })),
          { handled: 2, month: '2026-09', received: 3 },
          { handled: 0, month: '2026-10', received: 0 },
        ],
        quarters: [{ medianResponseDays: 2, quarter: '2026-T3', received: 3, responded: 2 }],
        statuses: [
          { count: 1, medianAgeDays: 35, status: DEMANDE_STATUS.TO_PROCESS, stuckCount: 0 },
          { count: 1, medianAgeDays: 24, status: DEMANDE_STATUS.UNREALISABLE, stuckCount: 0 },
          // demand 4 has no recorded change: counted from the start of the audit log (2025-12-01, Paris time)
          { count: 2, medianAgeDays: 179.7, status: DEMANDE_STATUS.RECONTACTED, stuckCount: 1 },
        ],
        summary: networkASummary,
      });
    });
  });
});
