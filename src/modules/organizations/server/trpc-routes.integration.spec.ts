import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedReseauDeChaleur, seedTableUser, seedZoneEtReseauEnConstruction } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: true, input: testUsers.admin },
];

const engieId = uuid(30);
const dalkiaId = uuid(31);

const seedOrganization = (id: string, name: string, patterns: string[]) =>
  kdb.insertInto('organizations').values({ gestionnaire_patterns: patterns, id, name }).execute();

const heatNetwork = (id_fcu: number, gestionnaire: string, organization_id: string | null = null) =>
  seedReseauDeChaleur({
    Gestionnaire: gestionnaire,
    id_fcu,
    nom_reseau: `Réseau ${id_fcu}`,
    organization_id,
    ouvert_aux_raccordements: true,
  });

const driftRow = (id_fcu: number, gestionnaire: string | null, organization: { id: string; name: string }) => ({
  gestionnaire,
  id_fcu,
  identifiant_reseau: null,
  nom_reseau: `Réseau ${id_fcu}`,
  organization_id: organization.id,
  organization_name: organization.name,
  type: 'reseau_de_chaleur' as const,
});

describe('organizations.admin.networks', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await kdb.deleteFrom('organizations').execute();
    await seedTableUser([{ ...testUsers.admin }, { ...testUsers.gestionnaire }]);
    await seedOrganization(engieId, 'ENGIE', ['%engie%']);
    await seedOrganization(dalkiaId, 'Dalkia', ['%dalkia%']);
  });

  describe('authorization', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      const label = user ? user.role : 'anonymous';
      it(`${label} ${allowed ? 'can' : 'cannot'} read the drift, attach and detach the unmatched networks`, async () => {
        await heatNetwork(1, 'ENGIE Solutions');
        const caller = createTestCaller(user);

        if (allowed) {
          await expect(caller.organizations.admin.networks.drift({ organizationId: engieId })).resolves.toBeDefined();
          await expect(
            caller.organizations.admin.networks.attach({ idFcu: 1, organizationId: engieId, type: 'reseau_de_chaleur' })
          ).resolves.toBe(1);
          await expect(caller.organizations.admin.networks.detachUnmatched({ organizationId: engieId })).resolves.toBe(0);
        } else {
          await expect(caller.organizations.admin.networks.drift({ organizationId: engieId })).rejects.toMatchObject(forbiddenError);
          await expect(
            caller.organizations.admin.networks.attach({ idFcu: 1, organizationId: engieId, type: 'reseau_de_chaleur' })
          ).rejects.toMatchObject(forbiddenError);
          await expect(caller.organizations.admin.networks.detachUnmatched({ organizationId: engieId })).rejects.toMatchObject(
            forbiddenError
          );
        }
      });
    });
  });

  it('lists the unattached networks matching a pattern, attaches one by one or all at once', async () => {
    await heatNetwork(1, 'ENGIE Solutions');
    await heatNetwork(2, 'Engie Réseaux');
    await seedZoneEtReseauEnConstruction({ gestionnaire: 'ENGIE', id_fcu: 3, nom_reseau: 'Réseau 3', ouvert_aux_raccordements: true });
    await heatNetwork(4, 'Coriance');
    const caller = createTestCaller(testUsers.admin);

    expect(await caller.organizations.admin.networks.drift({ organizationId: engieId })).toStrictEqual({
      attachedUnmatched: [],
      patterns: ['%engie%'],
      unattachedMatching: [
        driftRow(1, 'ENGIE Solutions', { id: engieId, name: 'ENGIE' }),
        driftRow(2, 'Engie Réseaux', { id: engieId, name: 'ENGIE' }),
        { ...driftRow(3, 'ENGIE', { id: engieId, name: 'ENGIE' }), type: 'reseau_en_construction' },
      ],
    });

    expect(
      await caller.organizations.admin.networks.attach({ idFcu: 1, organizationId: engieId, type: 'reseau_de_chaleur' })
    ).toStrictEqual(1);
    expect(await caller.organizations.admin.networks.refresh({ organizationId: engieId })).toStrictEqual(2);

    expect(await caller.organizations.admin.networks.drift({ organizationId: engieId })).toStrictEqual({
      attachedUnmatched: [],
      patterns: ['%engie%'],
      unattachedMatching: [],
    });
    expect((await caller.organizations.admin.networks.list({ organizationId: engieId })).map((network) => network.id_fcu)).toStrictEqual([
      1, 2, 3,
    ]);
  });

  it('flags an attached network whose gestionnaire changed, so the admin moves it to the other organization', async () => {
    await heatNetwork(1, 'ENGIE Solutions', engieId);
    await heatNetwork(2, 'ENGIE Réseaux', engieId);
    const caller = createTestCaller(testUsers.admin);

    // the operator of network 1 changes (survey import, admin edit): the attachment to ENGIE is stale
    await kdb.updateTable('reseaux_de_chaleur').set({ gestionnaire_fcu: 'Dalkia Sud' }).where('id_fcu', '=', 1).execute();

    expect(await caller.organizations.admin.networks.drift({ organizationId: engieId })).toStrictEqual({
      attachedUnmatched: [driftRow(1, 'Dalkia Sud', { id: engieId, name: 'ENGIE' })],
      patterns: ['%engie%'],
      unattachedMatching: [],
    });
    // still attached to ENGIE: not a candidate for Dalkia yet (attachments are never taken over)
    expect((await caller.organizations.admin.networks.drift({ organizationId: dalkiaId })).unattachedMatching).toStrictEqual([]);

    expect(await caller.organizations.admin.networks.detachUnmatched({ organizationId: engieId })).toStrictEqual(1);

    expect(await caller.organizations.admin.networks.drift({ organizationId: engieId })).toStrictEqual({
      attachedUnmatched: [],
      patterns: ['%engie%'],
      unattachedMatching: [],
    });
    expect(await caller.organizations.admin.networks.drift({ organizationId: dalkiaId })).toStrictEqual({
      attachedUnmatched: [],
      patterns: ['%dalkia%'],
      unattachedMatching: [driftRow(1, 'Dalkia Sud', { id: dalkiaId, name: 'Dalkia' })],
    });
    expect(
      await caller.organizations.admin.networks.attach({ idFcu: 1, organizationId: dalkiaId, type: 'reseau_de_chaleur' })
    ).toStrictEqual(1);
    expect(await kdb.selectFrom('reseaux_de_chaleur').select(['id_fcu', 'organization_id']).orderBy('id_fcu').execute()).toStrictEqual([
      { id_fcu: 1, organization_id: dalkiaId },
      { id_fcu: 2, organization_id: engieId },
    ]);
  });
});
