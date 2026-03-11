import type { User } from 'next-auth';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedEligibilityTestsData, seedProEligibilityTestsAddress } from '@/tests/fixtures';
import { eligibilityFixtures } from '@/tests/fixtures/eligibility';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

// Coordonnées du point test "réseau existant très proche" dans les fixtures d'éligibilité
// lon: 5.385355470995137, lat: 43.320001018219756
const TEST_POINT = eligibilityFixtures.features.find(
  (f) => f.properties.type === 'test' && f.properties.expectedEligibilityType === 'reseau_existant_tres_proche'
)!;
const [TEST_LON, TEST_LAT] = (TEST_POINT.geometry as GeoJSON.Point).coordinates;

vi.mock('@/modules/ban/server/service', () => ({
  getBANAddressFromAddress: vi.fn().mockResolvedValue({
    address: '1 Place de la République 13001 Marseille',
    latitude: 43.320001018219756,
    longitude: 5.385355470995137,
    result_city: 'Marseille',
    result_label: '1 Place de la République 13001 Marseille',
    result_score: 0.95,
    result_status: 'ok' as const,
  }),
}));

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('proEligibilityTestsRouter', () => {
  describe('updateEligibilityTestAddress', () => {
    beforeAll(async () => {
      await cleanDatabase();
      await seedEligibilityTestsData();
    });

    beforeEach(async () => {
      await kdb.deleteFrom('pro_eligibility_tests_addresses').execute();
      await kdb.deleteFrom('demands').execute();
      await seedProEligibilityTestsAddress({ id: uuid(999), source_address: '1 Place de la République 13001 Marseille' });
    });

    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: "autorise admin et retourne le résultat d'éligibilité", user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const callRoute = () =>
        createTestCaller(user).proEligibilityTests.updateEligibilityTestAddress({
          address: '1 Place de la République 13001 Marseille',
          addressId: uuid(999),
        });

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual({
          banAddress: '1 Place de la République 13001 Marseille',
          type: 'reseau_existant_tres_proche',
        });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('met à jour les legacy_values de la demande liée', async () => {
      const [demand] = await kdb
        .insertInto('demands')
        .values({
          legacy_values: JSON.stringify({ Adresse: 'ancienne adresse', Latitude: 48.8, Longitude: 2.3, Ville: 'Marseille' }),
        })
        .returningAll()
        .execute();

      const address = await seedProEligibilityTestsAddress({
        demand_id: demand.id,
        source_address: '1 Place de la République 13001 Marseille',
      });

      await createTestCaller(testUsers.admin).proEligibilityTests.updateEligibilityTestAddress({
        address: '1 Place de la République 13001 Marseille',
        addressId: address.id,
      });

      const updatedDemand = await kdb.selectFrom('demands').select('legacy_values').where('id', '=', demand.id).executeTakeFirstOrThrow();

      expect(updatedDemand.legacy_values).toStrictEqual({
        Adresse: '1 Place de la République 13001 Marseille',
        'Distance au réseau': 47,
        'Identifiant réseau': '1302C',
        Latitude: TEST_LAT,
        Longitude: TEST_LON,
        'Nom réseau': 'Réseau de chaleur',
        Ville: 'Marseille',
      });
    });
  });
});
