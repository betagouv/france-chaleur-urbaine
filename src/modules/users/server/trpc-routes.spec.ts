import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { createTestCaller, testUsers, unauthorizedError } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('usersRouter', () => {
  describe('users.getProfile', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
      { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.users.getProfile();

      if (allowed) {
        // Permission passe mais l'utilisateur n'existe pas en DB -> NOT_FOUND
        await expect(callRoute).rejects.toMatchObject({ code: 'NOT_FOUND' });
      } else {
        await expect(callRoute).rejects.toMatchObject(unauthorizedError);
      }
    });
  });

  describe('users.updateProfile', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise professionnel', user: testUsers.professionnel },
      { allowed: true, label: 'autorise gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () =>
        caller.users.updateProfile({
          first_name: 'Test',
          last_name: 'User',
          phone: null,
          structure_name: '',
          structure_other: '',
          structure_type: '',
        });

      if (allowed) {
        // Permission passe mais l'utilisateur n'existe pas en DB -> INTERNAL_SERVER_ERROR
        await expect(callRoute).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
      } else {
        await expect(callRoute).rejects.toMatchObject(unauthorizedError);
      }
    });
  });
});
