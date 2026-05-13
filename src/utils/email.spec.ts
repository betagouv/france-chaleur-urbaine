import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { pseudonymizeEmail } from './email';

describe('pseudonymizeEmail', () => {
  const cases: TestCase<string, string>[] = [
    { expectedOutput: 'j...n@f...e.fr', input: 'john@france-chaleur-urbaine.fr', label: 'email standard' },
    { expectedOutput: 'j...e@a...e.fr', input: 'jane.doe@alice.fr', label: 'local part avec point' },
    { expectedOutput: 'a@t...t.com', input: 'a@test.com', label: 'local part à un caractère' },
    { expectedOutput: 'a...b@t...t.com', input: 'ab@test.com', label: 'local part à deux caractères' },
    {
      expectedOutput: 't...s@s...b.e...e.c...o.uk',
      input: 'test.aze-toto+bonus@sub.example.co.uk',
      label: 'tous les labels sauf le TLD sont masqués',
    },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(pseudonymizeEmail(input)).toStrictEqual(expectedOutput);
  });

  it('retourne *** pour une entrée sans @', () => {
    expect(pseudonymizeEmail('invalid')).toStrictEqual('***');
  });
});
