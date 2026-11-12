import { beforeEach, describe, expect, it } from 'vitest';

import { buildDemandQuery } from '@/modules/demands/server/helpers';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedDemandeChaleurRenouvelable, seedProEligibilityTestsAddress, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, type TestCase, testUsers } from '@/tests/trpc-helpers';

const territorialUsers = [testUsers.alec, testUsers.ccrt, testUsers.collectivite, testUsers.gestionnaire];
const expectedConnectionAccessUsers = [testUsers.alec, testUsers.collectivite, testUsers.gestionnaire].map((user) => ({
  ...user,
  first_name: null,
  last_name: null,
  structure_name: null,
}));

const seedConnectionDemand = async (validated: boolean) => {
  const demandId = uuid(1);
  await kdb
    .insertInto('demands')
    .values({ departement_code: '75', id: demandId, legacy_values: JSON.stringify({}), validated })
    .execute();
  await seedProEligibilityTestsAddress({ demand_id: demandId, source_address: '10 Rue de Rivoli 75001 Paris' });
  return demandId;
};

describe('demand access-holder lists', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([testUsers.admin, ...territorialUsers]);
    await kdb
      .insertInto('user_permissions')
      .values(territorialUsers.map((user) => ({ resource_id: '75', type: 'departement' as const, user_id: user.id })))
      .execute();
  });

  const cases: TestCase<boolean, typeof expectedConnectionAccessUsers>[] = [
    { expectedOutput: expectedConnectionAccessUsers, input: true, label: 'validated connection demand' },
    { expectedOutput: expectedConnectionAccessUsers, input: false, label: 'connection demand awaiting validation' },
  ];

  it.each(cases)('excludes CCRT from the access holders of a $label', async (testCase) => {
    const demandId = await seedConnectionDemand(testCase.input);

    const users = await createTestCaller(testUsers.admin).permissions.listUsersWithAccessToDemand({ demandId });
    const demand = await buildDemandQuery().where('demands.id', '=', demandId).executeTakeFirstOrThrow();

    expect(users).toStrictEqual(testCase.expectedOutput);
    expect(demand.access_counts).toStrictEqual({ alec: 1, collectivite: 1, gestionnaire: 1 });
  });

  it('reports no access holders when only CCRT accounts cover a connection demand', async () => {
    await kdb.deleteFrom('user_permissions').where('user_id', '!=', testUsers.ccrt.id).execute();
    const demandId = await seedConnectionDemand(true);

    const users = await createTestCaller(testUsers.admin).permissions.listUsersWithAccessToDemand({ demandId });
    const demand = await buildDemandQuery().where('demands.id', '=', demandId).executeTakeFirstOrThrow();

    expect(users).toStrictEqual([]);
    expect(demand.access_counts).toStrictEqual({ alec: 0, collectivite: 0, gestionnaire: 0 });
  });

  it('opens a connection demand through a custom territory, to heat-network roles only', async () => {
    const customTerritoryId = uuid(600);
    const demandId = await seedConnectionDemand(true);
    // out of the seeded département permissions: only the custom territory can match
    await kdb
      .updateTable('demands')
      .set({ custom_territory_ids: [customTerritoryId], departement_code: '13' })
      .where('id', '=', demandId)
      .execute();
    await kdb
      .updateTable('user_permissions')
      .set({ resource_id: customTerritoryId, type: 'custom_territory' })
      .where('user_id', 'in', [testUsers.collectivite.id, testUsers.ccrt.id])
      .execute();

    const users = await createTestCaller(testUsers.collectivite).permissions.listUsersWithAccessToDemand({ demandId });
    const demand = await buildDemandQuery().where('demands.id', '=', demandId).executeTakeFirstOrThrow();
    const collectiviteDemands = await createTestCaller(testUsers.collectivite).demands.gestionnaire.list();
    const alecDemands = await createTestCaller(testUsers.alec).demands.gestionnaire.list();

    expect(users).toStrictEqual(expectedConnectionAccessUsers.filter((user) => user.id === testUsers.collectivite.id));
    expect(demand.access_counts).toStrictEqual({ alec: 0, collectivite: 1, gestionnaire: 0 });
    expect(collectiviteDemands.map((item) => item.id)).toStrictEqual([demandId]);
    expect(alecDemands).toStrictEqual([]);
  });

  const missingDemandCases: TestCase<'missing' | 'deleted', { code: 'NOT_FOUND' }>[] = [
    { expectedOutput: { code: 'NOT_FOUND' }, input: 'missing', label: 'missing demand' },
    { expectedOutput: { code: 'NOT_FOUND' }, input: 'deleted', label: 'deleted demand' },
  ];

  it.each(missingDemandCases)('rejects access-holder requests for a $label', async ({ input, expectedOutput }) => {
    const demandId = input === 'deleted' ? await seedConnectionDemand(true) : uuid(999);
    if (input === 'deleted') {
      await kdb.updateTable('demands').set({ deleted_at: new Date() }).where('id', '=', demandId).execute();
    }

    await expect(createTestCaller(testUsers.admin).permissions.listUsersWithAccessToDemand({ demandId })).rejects.toMatchObject(
      expectedOutput
    );
  });

  it('rejects access-holder requests outside the caller territory', async () => {
    const demandId = await seedConnectionDemand(true);
    await kdb.updateTable('user_permissions').set({ resource_id: '13' }).where('user_id', '=', testUsers.alec.id).execute();

    await expect(createTestCaller(testUsers.alec).permissions.listUsersWithAccessToDemand({ demandId })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('lists only CCRT as access holders of renewable-heat demands', async () => {
    const demand = await seedDemandeChaleurRenouvelable({ departement_code: '75', validated: true });

    const followUp = await createTestCaller(testUsers.ccrt).batEnr.ccrt.getFollowUp({ demandId: demand.id });

    expect(followUp.users).toStrictEqual([{ ...testUsers.ccrt, first_name: null, last_name: null, structure_name: null }]);
    expect(await createTestCaller(testUsers.ccrt).permissions.mine()).toStrictEqual([{ resource_id: '75', type: 'departement' }]);
  });
});
