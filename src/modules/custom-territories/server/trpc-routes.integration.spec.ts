import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb, sql } from '@/server/db/kysely';
import { cleanDatabase, seedCommune, seedDemandeChaleurRenouvelable, seedTableUser } from '@/tests/fixtures';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

import type { CustomTerritoryRecipe } from '../constants';
import { computeRecipeCommuneCodes, refreshDemandsCustomTerritoryIds } from './service';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: false, input: testUsers.ccrt },
  { expectedOutput: true, input: testUsers.admin },
];

/** Département 64 reduced to 4 communes: 2 in the CA Pays Basque, 2 in other EPCI. */
const seedPyreneesAtlantiques = async () => {
  await seedCommune({ insee_com: '64024', insee_dep: '64', insee_reg: '75', siren_epci: '200067254' }); // Pau
  await seedCommune({ insee_com: '64445', insee_dep: '64', insee_reg: '75', siren_epci: '200067262' }); // Orthez
  await seedCommune({ insee_com: '64102', insee_dep: '64', insee_reg: '75', siren_epci: '200067106' }); // Bayonne
  await seedCommune({ insee_com: '64065', insee_dep: '64', insee_reg: '75', siren_epci: '200067106' }); // Anglet
  await seedCommune({ insee_com: '40192', insee_dep: '40', insee_reg: '75', siren_epci: '200030435' }); // Mont-de-Marsan
};

const departement64HorsPaysBasque: CustomTerritoryRecipe = {
  exclude: [{ code: '200067106', type: 'epci' }],
  include: [{ code: '64', type: 'departement' }],
};

beforeEach(async () => {
  await cleanDatabase();
  await kdb.deleteFrom('ept').execute();
  await seedTableUser([testUsers.admin, testUsers.gestionnaire, testUsers.particulier, testUsers.ccrt]);
  await seedPyreneesAtlantiques();
});

describe('computeRecipeCommuneCodes', () => {
  it('returns the communes of the included territories minus the excluded ones', async () => {
    expect(await computeRecipeCommuneCodes(departement64HorsPaysBasque)).toStrictEqual(['64024', '64445']);
  });

  it('supports every territory type, including EPT membership and Grand Paris EPCI/EPT codes', async () => {
    await seedCommune({ insee_com: '92012', insee_dep: '92', insee_reg: '11', siren_epci: '200054781/200057974' });
    await kdb
      .insertInto('ept')
      .values({ code: '200057974', membres: JSON.stringify([{ code: '92012', nom: 'Boulogne' }]), nom: 'GPSO', type: 'EPT' })
      .execute();

    expect(await computeRecipeCommuneCodes({ exclude: [], include: [{ code: '200054781', type: 'epci' }] })).toStrictEqual(['92012']);
    expect(await computeRecipeCommuneCodes({ exclude: [], include: [{ code: '200057974', type: 'ept' }] })).toStrictEqual(['92012']);
    expect(await computeRecipeCommuneCodes({ exclude: [], include: [{ code: '11', type: 'region' }] })).toStrictEqual(['92012']);
    expect(
      await computeRecipeCommuneCodes({
        exclude: [{ code: '64024', type: 'commune' }],
        include: [
          { code: '64', type: 'departement' },
          { code: '40192', type: 'commune' },
        ],
      })
    ).toStrictEqual(['40192', '64065', '64102', '64445']);
  });
});

describe('customTerritories.admin', () => {
  describe('authorization', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      const label = user ? user.role : 'anonymous';
      it(`${label} ${allowed ? 'can' : 'cannot'} manage custom territories`, async () => {
        const caller = createTestCaller(user);
        const calls = [
          () => caller.customTerritories.admin.list(),
          () => caller.customTerritories.admin.previewRecipe(departement64HorsPaysBasque),
          () => caller.customTerritories.admin.create({ name: '64 hors Pays Basque', recipe: departement64HorsPaysBasque }),
          () => caller.customTerritories.admin.refreshDemands(),
        ];
        for (const call of calls) {
          if (allowed) {
            await expect(call()).resolves.toBeDefined();
          } else {
            await expect(call()).rejects.toMatchObject(forbiddenError);
          }
        }
      });
    });
  });

  it('creates a territory, stores its communes and tags the existing demands of those communes', async () => {
    const paloise = await seedDemandeChaleurRenouvelable({ commune_code: '64024', departement_code: '64' });
    const bayonnaise = await seedDemandeChaleurRenouvelable({ commune_code: '64102', departement_code: '64' });
    const caller = createTestCaller(testUsers.admin);

    expect(await caller.customTerritories.admin.previewRecipe(departement64HorsPaysBasque)).toStrictEqual({
      by_departement: [{ communes_count: 2, departement_code: '64', nom: '64' }],
      communes_count: 2,
    });

    const created = await caller.customTerritories.admin.create({ name: '64 hors Pays Basque', recipe: departement64HorsPaysBasque });
    expect(created).toMatchObject({ commune_codes: ['64024', '64445'], name: '64 hors Pays Basque', recipe: departement64HorsPaysBasque });

    const demands = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['id', 'custom_territory_ids'])
      .orderBy('commune_code')
      .execute();
    expect(demands).toStrictEqual([
      { custom_territory_ids: [created.id], id: paloise.id },
      { custom_territory_ids: [], id: bayonnaise.id },
    ]);

    const [listed] = await caller.customTerritories.admin.list();
    expect(listed).toMatchObject({ communes_count: 2, id: created.id, users_count: 0 });
  });

  it('refuses a recipe covering no commune and a duplicated name', async () => {
    const caller = createTestCaller(testUsers.admin);
    await expect(
      caller.customTerritories.admin.create({ name: 'Vide', recipe: { exclude: [], include: [{ code: '99', type: 'departement' }] } })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await caller.customTerritories.admin.create({ name: 'Béarn', recipe: departement64HorsPaysBasque });
    await expect(caller.customTerritories.admin.create({ name: 'béarn', recipe: departement64HorsPaysBasque })).rejects.toThrow();
  });

  it('updates the recipe and re-tags the demands, then deletes the territory with its permissions', async () => {
    const paloise = await seedDemandeChaleurRenouvelable({ commune_code: '64024', departement_code: '64' });
    const caller = createTestCaller(testUsers.admin);
    const created = await caller.customTerritories.admin.create({ name: 'Béarn', recipe: departement64HorsPaysBasque });
    await caller.permissions.admin.setForUser({
      permissions: [{ resource_id: created.id, type: 'custom_territory' }],
      userId: testUsers.ccrt.id,
    });

    const updated = await caller.customTerritories.admin.update({
      id: created.id,
      name: 'Orthez seulement',
      recipe: { exclude: [], include: [{ code: '64445', type: 'commune' }] },
    });
    expect(updated.commune_codes).toStrictEqual(['64445']);
    expect(
      await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select('custom_territory_ids')
        .where('id', '=', paloise.id)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ custom_territory_ids: [] });
    expect(await caller.customTerritories.admin.list()).toMatchObject([{ users_count: 1 }]);

    await caller.customTerritories.admin.delete({ id: created.id });
    expect(await caller.customTerritories.admin.list()).toStrictEqual([]);
    expect(await kdb.selectFrom('user_permissions').select('resource_id').where('user_id', '=', testUsers.ccrt.id).execute()).toStrictEqual(
      []
    );
  });

  it('exposes the territory to its permission holders: label, geometry and bounds', async () => {
    const admin = createTestCaller(testUsers.admin);
    const created = await admin.customTerritories.admin.create({ name: 'Béarn', recipe: departement64HorsPaysBasque });
    await admin.permissions.admin.setForUser({
      permissions: [{ resource_id: created.id, type: 'custom_territory' }],
      userId: testUsers.ccrt.id,
    });
    await kdb
      .updateTable('ign_communes')
      .set({ geom: sql`ST_Multi(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(-0.37, 43.3), 4326), 2154), 1000))` })
      .where('insee_com', '=', '64024')
      .execute();
    const ccrt = createTestCaller(testUsers.ccrt);

    expect(await ccrt.permissions.mineWithLabels()).toStrictEqual([{ label: 'Béarn', resource_id: created.id, type: 'custom_territory' }]);
    expect(await admin.permissions.searchCustomTerritories({ search: 'béa' })).toStrictEqual([
      { communes_count: 2, id: created.id, name: 'Béarn' },
    ]);

    const mapData = await ccrt.permissions.myMapData();
    expect(mapData.territories.features.map((feature) => feature.properties)).toStrictEqual([
      { code: created.id, label: 'Béarn', type: 'custom_territory' },
    ]);
    expect(mapData.bounds).not.toBeNull();
    expect(Object.keys(mapData.perPermissionBounds)).toStrictEqual([`custom_territory:${created.id}`]);
  });

  it('refreshDemands realigns demands whose commune changed and reports the number of rows touched', async () => {
    const caller = createTestCaller(testUsers.admin);
    const created = await caller.customTerritories.admin.create({ name: 'Béarn', recipe: departement64HorsPaysBasque });
    const demand = await seedDemandeChaleurRenouvelable({ commune_code: '64102', departement_code: '64' });
    // simulate a correction that moved the demand into the territory without going through the service
    await kdb.updateTable('demands_chaleur_renouvelable').set({ commune_code: '64024' }).where('id', '=', demand.id).execute();

    expect(await refreshDemandsCustomTerritoryIds()).toStrictEqual({ demands: 0, demands_chaleur_renouvelable: 1 });
    expect(await refreshDemandsCustomTerritoryIds()).toStrictEqual({ demands: 0, demands_chaleur_renouvelable: 0 });
    expect(
      await kdb
        .selectFrom('demands_chaleur_renouvelable')
        .select('custom_territory_ids')
        .where('id', '=', demand.id)
        .executeTakeFirstOrThrow()
    ).toStrictEqual({ custom_territory_ids: [created.id] });
  });
});
