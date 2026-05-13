import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('dataDiagnosticRouter', () => {
  describe('dataDiagnostic.run', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.dataDiagnostic.run();

      if (allowed) {
        const result = await callRoute();
        expect(result).toMatchObject({
          generatedAt: expect.any(String),
          issues: expect.any(Array),
        });
        for (const issue of result.issues) {
          expect(issue).toMatchObject({
            description: expect.any(String),
            items: expect.any(Array),
            severity: expect.stringMatching(/^(error|warning)$/),
            title: expect.any(String),
            totalCount: expect.any(Number),
            truncated: expect.any(Boolean),
            type: expect.any(String),
          });
        }
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });
  });
});
