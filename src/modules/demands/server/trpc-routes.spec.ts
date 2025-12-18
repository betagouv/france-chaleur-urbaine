import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('demandsRouter', () => {
  describe('demands.admin', () => {
    describe('list', () => {
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
        { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
        { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.admin.list();

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual({ count: 0, items: [] });
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });
    });

    describe('getTagsStats', () => {
      const permissionTests: PermissionTestCase[] = [
        { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
        { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
        { allowed: true, label: 'autorise admin', user: testUsers.admin },
      ];

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.admin.getTagsStats();

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
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.gestionnaire.list();

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

      it.each(permissionTests)('$label', async ({ user, allowed }) => {
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.gestionnaire.listEmails({ demand_id: uuid(999) });

        if (allowed) {
          await expect(callRoute()).resolves.toStrictEqual([]);
        } else {
          await expect(callRoute).rejects.toMatchObject(forbiddenError);
        }
      });

      // Pour gestionnaire/admin, la permission passe mais échoue car la demande n'existe pas
      // On vérifie que l'erreur est INTERNAL_SERVER_ERROR (pas FORBIDDEN), ce qui prouve que la permission est passée
      it.each([
        { label: 'gestionnaire', user: testUsers.gestionnaire },
        { label: 'admin', user: testUsers.admin },
      ])('autorise $label (passe les permissions)', async ({ user }) => {
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.gestionnaire.listEmails({ demand_id: uuid(999) });

        await expect(callRoute).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
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
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.user.list();

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
        const caller = createTestCaller(user);
        const callRoute = () => caller.demands.user.createBatch({ addresses: [], termOfUse: true });

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
        const caller = createTestCaller(null);
        const callRoute = () => caller.demands.user.create({} as any);

        // La route est publique, on attend BAD_REQUEST (validation) pas FORBIDDEN
        await expect(callRoute).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      });
    });
  });
});
