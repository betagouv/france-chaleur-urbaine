import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { seedTableUser } from '@/tests/fixtures';
import { createTestCaller, testUsers } from '@/tests/trpc-helpers';

import { getUserSession } from './session';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('authRouter', () => {
  it('loads a CCRT session from the schema with JSONB user preferences', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    await seedTableUser([{ ...testUsers.ccrt, created_at: createdAt }]);
    await expect(getUserSession(testUsers.ccrt.id)).resolves.toStrictEqual({
      active: true,
      created_at: createdAt,
      email: testUsers.ccrt.email,
      id: testUsers.ccrt.id,
      role: 'ccrt',
    });
  });

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
        // Route publique - l'email ne correspond à aucun user, la mutation retourne undefined
        // sans erreur : ça prouve que la permission est passée (sinon ce serait UNAUTHORIZED/FORBIDDEN)
        await expect(callRoute()).resolves.toBeUndefined();
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
