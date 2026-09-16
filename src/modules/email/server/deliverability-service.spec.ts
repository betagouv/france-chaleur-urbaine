import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { type BlockedContactInput, computeBlockedContactsDiff } from './deliverability-service';

const contact = (email: string, overrides: Partial<BlockedContactInput> = {}): BlockedContactInput => ({
  blocked_at: new Date('2026-09-01T10:00:00Z'),
  email,
  reason_code: 'hardBounce',
  ...overrides,
});

describe('computeBlockedContactsDiff', () => {
  const cases: TestCase<{ local: string[]; remote: BlockedContactInput[] }, { added: string[]; removed: string[]; upserts: string[] }>[] = [
    {
      expectedOutput: { added: ['a@test.local'], removed: [], upserts: ['a@test.local'] },
      input: { local: [], remote: [contact('a@test.local')] },
      label: 'first sync: every remote contact is added',
    },
    {
      expectedOutput: { added: [], removed: [], upserts: ['a@test.local'] },
      input: { local: ['a@test.local'], remote: [contact('a@test.local')] },
      label: 'unchanged contact is only upserted',
    },
    {
      expectedOutput: { added: [], removed: ['a@test.local'], upserts: [] },
      input: { local: ['a@test.local'], remote: [] },
      label: 'contact missing remotely is removed',
    },
    {
      expectedOutput: { added: ['b@test.local'], removed: ['a@test.local'], upserts: ['b@test.local'] },
      input: { local: ['a@test.local'], remote: [contact('b@test.local')] },
      label: 'mixed additions and removals',
    },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    const result = computeBlockedContactsDiff(
      input.local.map((email) => ({ email })),
      input.remote
    );
    expect({
      added: result.added.map((item) => item.email),
      removed: result.removed,
      upserts: result.upserts.map((item) => item.email),
    }).toStrictEqual(expectedOutput);
  });

  it('keeps the first occurrence of a duplicated remote email', () => {
    const result = computeBlockedContactsDiff(
      [],
      [contact('a@test.local'), contact('a@test.local', { reason_code: 'unsubscribedViaEmail' })]
    );
    expect(result.upserts).toStrictEqual([contact('a@test.local')]);
  });
});
