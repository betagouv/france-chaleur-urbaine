import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  expectedCode: 'FORBIDDEN' | 'success' | 'BAD_REQUEST';
};

/**
 * Helper pour tester les permissions d'une route tRPC.
 */
const testPermission = async (routeFn: () => Promise<unknown>, expectedCode: PermissionTestCase['expectedCode']) => {
  if (expectedCode === 'FORBIDDEN') {
    await expect(routeFn).rejects.toMatchObject(forbiddenError);
  } else if (expectedCode === 'BAD_REQUEST') {
    await expect(routeFn).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  } else {
    // La route passe les permissions, on vérifie juste que ça ne throw pas FORBIDDEN
    await expect(routeFn()).resolves.not.toBeUndefined();
  }
};

describe('demandsRouter', () => {
  describe('demands.admin', () => {
    describe('list', () => {
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        { expectedCode: 'FORBIDDEN', label: 'refuse particulier', user: testUsers.particulier },
        { expectedCode: 'FORBIDDEN', label: 'refuse professionnel', user: testUsers.professionnel },
        { expectedCode: 'FORBIDDEN', label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { expectedCode: 'success', label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.admin.list(), expectedCode);
      });
    });

    describe('getTagsStats', () => {
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        { expectedCode: 'FORBIDDEN', label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { expectedCode: 'success', label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.admin.getTagsStats(), expectedCode);
      });
    });
  });

  describe('demands.gestionnaire', () => {
    describe('list', () => {
      // Permissions: ['gestionnaire'] - admin n'a pas accès
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        { expectedCode: 'FORBIDDEN', label: 'refuse particulier', user: testUsers.particulier },
        { expectedCode: 'FORBIDDEN', label: 'refuse professionnel', user: testUsers.professionnel },
        { expectedCode: 'FORBIDDEN', label: 'refuse admin', user: testUsers.admin },
        { expectedCode: 'success', label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.gestionnaire.list(), expectedCode);
      });
    });

    describe('listEmails', () => {
      // Permissions: ['gestionnaire', 'admin']
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        { expectedCode: 'FORBIDDEN', label: 'refuse particulier', user: testUsers.particulier },
        { expectedCode: 'FORBIDDEN', label: 'refuse professionnel', user: testUsers.professionnel },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.gestionnaire.listEmails({ demand_id: uuid(999) }), expectedCode);
      });

      // Pour gestionnaire/admin, la permission passe mais échoue car la demande n'existe pas
      it.each([
        { label: 'gestionnaire', user: testUsers.gestionnaire },
        { label: 'admin', user: testUsers.admin },
      ])('autorise $label (passe les permissions)', async ({ user }) => {
        const caller = createTestCaller(user);
        const nonExistentDemandId = uuid(999);
        // La permission passe, mais la demande n'existe pas
        await expect(() => caller.demands.gestionnaire.listEmails({ demand_id: nonExistentDemandId })).rejects.toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
        });
      });
    });
  });

  describe('demands.user', () => {
    describe('list', () => {
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        { expectedCode: 'success', label: 'autorise particulier', user: testUsers.particulier },
        { expectedCode: 'success', label: 'autorise professionnel', user: testUsers.professionnel },
        { expectedCode: 'success', label: 'autorise gestionnaire', user: testUsers.gestionnaire },
        { expectedCode: 'success', label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.user.list(), expectedCode);
      });
    });

    describe('createBatch', () => {
      const permissionTests: PermissionTestCase[] = [
        { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
        // BAD_REQUEST car addresses vide est invalide, mais la permission passe
        { expectedCode: 'BAD_REQUEST', label: 'autorise particulier', user: testUsers.particulier },
        { expectedCode: 'BAD_REQUEST', label: 'autorise professionnel', user: testUsers.professionnel },
      ];

      it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
        const caller = createTestCaller(user);
        await testPermission(() => caller.demands.user.createBatch({ addresses: [], termOfUse: true }), expectedCode);
      });
    });

    describe('create (public)', () => {
      it('autorise utilisateur non authentifié', async () => {
        const caller = createTestCaller(null);
        // La route est publique, l'erreur ne doit pas être FORBIDDEN
        await expect(() => caller.demands.user.create({} as any)).rejects.not.toMatchObject({ code: 'FORBIDDEN' });
      });
    });
  });
});
