import { describe, expect, it } from 'vitest';

import { invalidPermissionsError } from '@/server/helpers/server';
import type { TestCaseBoolean } from '@/tests/trpc-helpers';

import { ensureEngieOrganization } from './engie-users';

describe('ensureEngieOrganization()', () => {
  const cases: TestCaseBoolean<string>[] = [
    { expectedOutput: true, input: 'ENGIE' },
    { expectedOutput: false, input: 'Idex' },
    { expectedOutput: false, input: 'Engie' },
    { expectedOutput: false, input: 'ENGIE Solutions' },
  ];

  cases.forEach(({ input, expectedOutput }) => {
    it(`${expectedOutput ? 'accepte' : 'refuse'} l'organisation « ${input} »`, () => {
      const call = () => ensureEngieOrganization({ credentialId: 'credential', organizationId: 'org', organizationName: input });
      if (expectedOutput) {
        expect(call).not.toThrow();
      } else {
        expect(call).toThrow(invalidPermissionsError);
      }
    });
  });
});
