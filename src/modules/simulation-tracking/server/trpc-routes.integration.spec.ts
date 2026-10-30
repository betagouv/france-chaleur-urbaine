import type { User } from 'next-auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { businessRules } from '@/modules/app/business-rules';
import { purgeOldConversionEventIps } from '@/modules/conversion-tracking/server/service';
import { appRouter } from '@/modules/trpc/trpc.config';
import { type DB, type InsertObject, kdb, sql } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createMockContext, createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import type { CreateSimulationInput, SimulationSnapshot } from '../constants';
import type { SimulationFunnelRow } from './service';

const adminOnlyPermissions: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => hoursAgo(days * 24);
/** Upper bound of the queried period: rows seeded during the test are stamped by the database after `now`. */
const inAnHour = hoursAgo(-1);

const snapshot: SimulationSnapshot = {
  address: '14 Rue Lecourbe 75015 Paris',
  addressResolved: true,
  batimentConstructionId: 'bdnb-bc-1',
  ccrtDemandAvailable: true,
  communeCode: '75115',
  departementCode: '75',
  heatNetworkAvailable: true,
  housingType: 'immeuble_chauffage_collectif',
  outdoorSpace: 'jardinCours',
  radiatorType: 'radiateur-eau',
  recommendedSolution: 'collective-heat-network',
  refusalAlreadyKnown: false,
};

const createInput = (overrides: Partial<CreateSimulationInput> = {}): CreateSimulationInput => ({
  ...snapshot,
  host: null,
  id: uuid(1),
  page: '/',
  previousSimulationId: null,
  route: '/',
  source: null,
  ...overrides,
});

const selectSimulation = (id: string) =>
  kdb.selectFrom('simulations_chaleur_renouvelable').selectAll().where('id', '=', id).executeTakeFirstOrThrow();

/** Direct seed with a controlled `created_at` (the public route always stamps `now()`). */
const seedSimulation = (values: Partial<InsertObject<DB, 'simulations_chaleur_renouvelable'>> = {}) =>
  kdb
    .insertInto('simulations_chaleur_renouvelable')
    .values({
      ccrt_demand_available: false,
      heat_network_available: false,
      housing_type: 'maison_individuelle',
      id: uuid(900),
      page: '/',
      route: '/',
      ...values,
    })
    .execute();

const funnelRow = (row: Partial<SimulationFunnelRow>): SimulationFunnelRow => ({
  addressResolved: true,
  ccrtDemandAvailable: false,
  hasSolution: false,
  heatNetworkAvailable: false,
  outcome: null,
  refusalAlreadyKnown: false,
  revised: 0,
  route: '/',
  simulations: 1,
  source: null,
  ...row,
});

/** The funnel groups carry no order: compare them sorted. */
const sortedRows = (rows: SimulationFunnelRow[]) =>
  [...rows].sort((rowA, rowB) => JSON.stringify(rowA).localeCompare(JSON.stringify(rowB)));

describe('simulationTracking', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedTableUser([{ email: testUsers.admin.email, id: testUsers.admin.id, role: 'admin' }]);
  });

  beforeEach(async () => {
    await Promise.all([
      kdb.deleteFrom('simulations_chaleur_renouvelable').execute(),
      kdb.deleteFrom('conversion_events').execute(),
      kdb.deleteFrom('conversion_ip_rules').execute(),
    ]);
  });

  describe('create (public)', () => {
    it('stores the start page, the snapshot and the anti-abuse columns', async () => {
      await createTestCaller(null).simulationTracking.create(createInput({ host: 'partenaire.fr/page', source: 'iframe-test' }));

      expect(await selectSimulation(uuid(1))).toMatchObject({
        address: snapshot.address,
        address_resolved: true,
        batiment_construction_id: 'bdnb-bc-1',
        ccrt_demand_available: true,
        commune_code: '75115',
        demand_id: null,
        departement_code: '75',
        excluded: false,
        heat_network_available: true,
        host: 'partenaire.fr/page',
        housing_type: 'immeuble_chauffage_collectif',
        ip: '127.0.0.1',
        outcome: null,
        outcome_at: null,
        outdoor_space: 'jardinCours',
        page: '/',
        previous_simulation_id: null,
        radiator_type: 'radiateur-eau',
        recommended_solution: 'collective-heat-network',
        refusal_already_known: false,
        revisions: 0,
        route: '/',
        source: 'iframe-test',
        user_agent: null,
      });
    });

    it('chains a simulation to the previous one of the same results page', async () => {
      const caller = createTestCaller(null);
      await caller.simulationTracking.create(createInput());
      await caller.simulationTracking.create(createInput({ id: uuid(2), previousSimulationId: uuid(1) }));

      expect((await selectSimulation(uuid(2))).previous_simulation_id).toStrictEqual(uuid(1));
    });

    it('ignores a replay of the same id instead of overwriting the row', async () => {
      const caller = createTestCaller(null);
      await caller.simulationTracking.create(createInput());
      await caller.simulationTracking.create(createInput({ housingType: 'maison_individuelle', route: '/chaleur-renouvelable' }));

      expect(await selectSimulation(uuid(1))).toMatchObject({ housing_type: 'immeuble_chauffage_collectif', route: '/' });
    });

    it('drops crawlers silently', async () => {
      const botCaller = appRouter.createCaller({
        ...createMockContext(null),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      });
      await botCaller.simulationTracking.create(createInput());

      expect(await kdb.selectFrom('simulations_chaleur_renouvelable').selectAll().execute()).toHaveLength(0);
    });

    it('enters excluded when a rule already bans the IP', async () => {
      await kdb
        .insertInto('conversion_ip_rules')
        .values({ disposition: 'exclude', ip: sql<string>`'127.0.0.1'::inet`, reason: 'test' })
        .execute();
      await createTestCaller(null).simulationTracking.create(createInput());

      expect((await selectSimulation(uuid(1))).excluded).toStrictEqual(true);
    });
  });

  describe('update (public)', () => {
    it('replaces the snapshot and counts the revision', async () => {
      const caller = createTestCaller(null);
      await caller.simulationTracking.create(createInput());
      await caller.simulationTracking.update({
        ...snapshot,
        heatNetworkAvailable: false,
        id: uuid(1),
        recommendedSolution: 'collective-biomass-boiler',
      });

      expect(await selectSimulation(uuid(1))).toMatchObject({
        heat_network_available: false,
        recommended_solution: 'collective-biomass-boiler',
        revisions: 1,
      });
    });

    it.each([
      ['older than the update window', { created_at: hoursAgo(businessRules.fcrSimulationUpdateWindowHours.value + 1) }],
      ['past the revisions cap', { revisions: businessRules.fcrSimulationMaxRevisions.value }],
    ])('ignores a simulation %s', async (_, seed) => {
      await seedSimulation({ id: uuid(1), recommended_solution: 'house-wood-stove', ...seed });
      await createTestCaller(null).simulationTracking.update({ ...snapshot, id: uuid(1) });

      expect((await selectSimulation(uuid(1))).recommended_solution).toStrictEqual('house-wood-stove');
    });
  });

  describe('recordOutcome (public)', () => {
    it('records the first outcome only, with the created demand id', async () => {
      const caller = createTestCaller(null);
      await caller.simulationTracking.create(createInput());
      await caller.simulationTracking.recordOutcome({ demandId: 'demand-1', id: uuid(1), outcome: 'heat_network_demand' });
      await caller.simulationTracking.recordOutcome({ id: uuid(1), outcome: 'france_renov_orientation' });

      const row = await selectSimulation(uuid(1));
      expect(row).toMatchObject({ demand_id: 'demand-1', outcome: 'heat_network_demand' });
      expect(row.outcome_at).toBeInstanceOf(Date);
    });
  });

  describe('getFunnel (admin)', () => {
    describe('permissions', () => {
      adminOnlyPermissions.forEach(({ input: user, expectedOutput: allowed }) => {
        it(`${allowed ? 'allows' : 'forbids'} ${user?.role ?? 'anonymous'}`, async () => {
          const call = () => createTestCaller(user).simulationTracking.getFunnel({ dateFrom: daysAgo(30), dateTo: inAnHour });
          if (allowed) {
            await expect(call()).resolves.toBeDefined();
          } else {
            await expect(call).rejects.toMatchObject(forbiddenError);
          }
        });
      });
    });

    it('groups the period by start page, offered options and outcome, ignoring excluded rows and the filters', async () => {
      await Promise.all([
        seedSimulation({ heat_network_available: true, id: uuid(1), outcome: 'heat_network_demand', revisions: 2 }),
        seedSimulation({ heat_network_available: true, id: uuid(2), recommended_solution: 'collective-heat-network' }),
        seedSimulation({
          ccrt_demand_available: true,
          id: uuid(3),
          outcome: 'ccrt_demand',
          page: '/chaleur-renouvelable',
          route: '/chaleur-renouvelable',
        }),
        seedSimulation({ excluded: true, heat_network_available: true, id: uuid(4) }),
        seedSimulation({ created_at: daysAgo(40), heat_network_available: true, id: uuid(5) }),
        seedSimulation({
          departement_code: '13',
          id: uuid(6),
          outcome: 'france_renov_orientation',
          refusal_already_known: true,
          route: '/chaleur-renouvelable/resultat',
        }),
      ]);
      const caller = createTestCaller(testUsers.admin);

      expect(sortedRows(await caller.simulationTracking.getFunnel({ dateFrom: daysAgo(30), dateTo: inAnHour }))).toStrictEqual(
        sortedRows([
          funnelRow({ heatNetworkAvailable: true, outcome: 'heat_network_demand', revised: 1 }),
          funnelRow({ hasSolution: true, heatNetworkAvailable: true }),
          funnelRow({ ccrtDemandAvailable: true, outcome: 'ccrt_demand', route: '/chaleur-renouvelable' }),
          funnelRow({ outcome: 'france_renov_orientation', refusalAlreadyKnown: true, route: '/chaleur-renouvelable/resultat' }),
        ])
      );
      expect(await caller.simulationTracking.getFunnel({ dateFrom: daysAgo(30), dateTo: inAnHour, departementCode: '13' })).toStrictEqual([
        funnelRow({ outcome: 'france_renov_orientation', refusalAlreadyKnown: true, route: '/chaleur-renouvelable/resultat' }),
      ]);
    });
  });

  describe('shared anti-abuse', () => {
    it('reconciles excluded on simulations when an IP rule changes', async () => {
      await createTestCaller(null).simulationTracking.create(createInput());
      const admin = createTestCaller(testUsers.admin);

      const banned = await admin.conversionTracking.ipRules.upsert({ disposition: 'exclude', ip: '127.0.0.0/24', reason: 'spam' });
      expect(banned.changedEvents).toStrictEqual(1);
      expect((await selectSimulation(uuid(1))).excluded).toStrictEqual(true);

      await admin.conversionTracking.ipRules.remove({ ip: '127.0.0.0/24' });
      expect((await selectSimulation(uuid(1))).excluded).toStrictEqual(false);
    });

    it('purges IP, user agent, address and building id of old simulations, keeping the counters', async () => {
      await Promise.all([
        seedSimulation({
          address: 'old',
          batiment_construction_id: 'bdnb-old',
          created_at: daysAgo(businessRules.conversionIpRetentionDays.value + 1),
          id: uuid(1),
          ip: sql<string>`'10.0.0.1'::inet`,
          user_agent: 'ua',
        }),
        seedSimulation({
          address: 'recent',
          batiment_construction_id: 'bdnb-recent',
          id: uuid(2),
          ip: sql<string>`'10.0.0.2'::inet`,
          user_agent: 'ua',
        }),
      ]);

      expect(await purgeOldConversionEventIps()).toStrictEqual(1);
      expect(await selectSimulation(uuid(1))).toMatchObject({
        address: null,
        batiment_construction_id: null,
        housing_type: 'maison_individuelle',
        ip: null,
        user_agent: null,
      });
      expect(await selectSimulation(uuid(2))).toMatchObject({
        address: 'recent',
        batiment_construction_id: 'bdnb-recent',
        ip: '10.0.0.2',
        user_agent: 'ua',
      });
    });
  });
});
