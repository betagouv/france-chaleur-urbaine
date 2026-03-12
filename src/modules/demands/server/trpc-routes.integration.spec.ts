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

describe('demandsRouter', () => {
  describe('demands.admin', () => {
    beforeAll(async () => {
      await cleanDatabase();
      await seedEligibilityTestsData();
    });

    describe('list', () => {
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
        { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
        { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.admin.list();

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual({ count: 0, items: [] });
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    describe('recalculateEligibility', () => {
      let testDemandId: string;

      beforeEach(async () => {
        await kdb.deleteFrom('pro_eligibility_tests_addresses').execute();
        await kdb.deleteFrom('demands').execute();
        const [demand] = await kdb
          .insertInto('demands')
          .values({ legacy_values: JSON.stringify({ Adresse: 'ancienne adresse', Latitude: 48.8, Longitude: 2.3, Ville: 'Marseille' }) })
          .returningAll()
          .execute();
        await seedProEligibilityTestsAddress({ demand_id: demand.id, source_address: '1 Place de la République 13001 Marseille' });
        testDemandId = demand.id;
      });

      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
        { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
        { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: "autorise admin et recalcule l'éligibilité depuis l'adresse source", user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.admin.recalculateEligibility({ demandId: testDemandId });

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual({
            banAddress: '1 Place de la République 13001 Marseille',
            type: 'reseau_existant_tres_proche',
          });
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });

      it('met à jour les legacy_values de la demande', async () => {
        await createTestCaller(testUsers.admin).demands.admin.recalculateEligibility({ demandId: testDemandId });

        const updatedDemand = await kdb
          .selectFrom('demands')
          .select('legacy_values')
          .where('id', '=', testDemandId)
          .executeTakeFirstOrThrow();

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

    describe('getTagsStats', () => {
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.admin.getTagsStats();

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual([]);
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });
  });

  describe('demands.gestionnaire', () => {
    describe('list', () => {
      // Permissions: ['gestionnaire'] - admin n'a pas accès
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
        { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
        { allowed: false, label: 'refuse admin', user: testUsers.admin },
        { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.gestionnaire.list();

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual([]);
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    describe('listEmails', () => {
      // Permissions: ['gestionnaire', 'admin']
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
        { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      ];

      it.each(permissionTests)('$label', async ({ user }) => {
        await expect(() => createTestCaller(user).demands.gestionnaire.listEmails({ demand_id: uuid(999) })).rejects.toMatchObject(
          forbiddenError
        );
      });

      // Pour gestionnaire/admin, la permission passe mais échoue car la demande n'existe pas
      // On vérifie que l'erreur est INTERNAL_SERVER_ERROR (pas FORBIDDEN), ce qui prouve que la permission est passée
      it.each([
        { label: 'gestionnaire', user: testUsers.gestionnaire },
        { label: 'admin', user: testUsers.admin },
      ])('autorise $label (passe les permissions)', async ({ user }) => {
        await expect(() => createTestCaller(user).demands.gestionnaire.listEmails({ demand_id: uuid(999) })).rejects.toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
        });
      });
    });
  });

  describe('demands.user', () => {
    describe('list', () => {
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
        { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
        { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.user.list();

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual([]);
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    describe('createBatch', () => {
      // Permission passe pour tous les utilisateurs authentifiés
      // BAD_REQUEST car addresses vide est invalide, ce qui prouve que la permission est passée
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
        { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const callRoute = () => createTestCaller(user).demands.user.createBatch({ addresses: [], termOfUse: true });

        if (allowed) {
          // BAD_REQUEST prouve que la permission est passée (sinon ce serait FORBIDDEN)
          await expect(callRoute).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    describe('create (public)', () => {
      it('autorise utilisateur non authentifié', async () => {
        // La route est publique, on attend BAD_REQUEST (validation) pas FORBIDDEN
        await expect(() => createTestCaller(null).demands.user.create({} as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      });
    });
  });
});
