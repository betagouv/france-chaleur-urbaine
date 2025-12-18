import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('jobsRouter', () => {
  describe('jobs.list', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.jobs.list({});

      if (allowed) {
        await expect(callRoute()).resolves.toStrictEqual({
          jobs: [],
          pagination: {
            hasNext: false,
            limit: 50,
            offset: 0,
            total: 0,
          },
        });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });
  });
});
