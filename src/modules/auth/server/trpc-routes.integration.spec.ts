import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { createTestCaller, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('authRouter', () => {
  describe('auth.resetPassword', () => {
    // Route publique - tout le monde peut demander un reset
    const permissionTests: PermissionTestCase[] = [
      { allowed: true, label: 'autorise utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.auth.resetPassword({ email: 'test@example.com' });

      if (allowed) {
        // Route publique - permission passe, mais Airtable est bloqué en test -> INTERNAL_SERVER_ERROR
        // Cela prouve que la permission est passée (sinon ce serait UNAUTHORIZED/FORBIDDEN)
        await expect(callRoute).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
      } else {
        await expect(callRoute).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
      }
    });
  });

  describe('auth.changePassword', () => {
    // Route publique avec validation JWT dans l'input
    const permissionTests: PermissionTestCase[] = [
      { allowed: true, label: 'autorise utilisateur non authentifié', user: null },
      { allowed: true, label: 'autorise particulier', user: testUsers.particulier },
    ];

    it.each(permissionTests)('$label (rejeté par validation JWT)', async ({ user }) => {
      const caller = createTestCaller(user);
      const callRoute = () =>
        caller.auth.changePassword({
          password: 'NewPassword123!',
          token: 'invalid-token',
        });

      // La route est publique mais le token JWT est invalide -> BAD_REQUEST
      await expect(callRoute).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
