import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { createTestCaller, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  expectedCode: 'FORBIDDEN' | 'success';
};

describe('jobsRouter', () => {
  describe('jobs.list', () => {
    const permissionTests: PermissionTestCase[] = [
      { expectedCode: 'FORBIDDEN', label: 'refuse utilisateur non authentifié', user: null },
      { expectedCode: 'FORBIDDEN', label: 'refuse particulier', user: testUsers.particulier },
      { expectedCode: 'FORBIDDEN', label: 'refuse professionnel', user: testUsers.professionnel },
      { expectedCode: 'FORBIDDEN', label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { expectedCode: 'success', label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, expectedCode }) => {
      const caller = createTestCaller(user);

      if (expectedCode === 'FORBIDDEN') {
        await expect(caller.jobs.list({})).rejects.toMatchObject({
          code: 'FORBIDDEN',
          message: 'Permissions invalides',
        });
      } else {
        const result = await caller.jobs.list({});
        expect(result).toMatchObject({
          jobs: expect.any(Array),
          pagination: expect.objectContaining({ limit: 50, offset: 0 }),
        });
      }
    });
  });
});
