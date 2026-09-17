import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { parseBrevoDate } from './brevo-client';

describe('parseBrevoDate', () => {
  const cases: TestCase<string, string>[] = [
    {
      expectedOutput: '2026-09-16T13:41:43.830Z',
      input: '2026-09-16T15:41:43.830Z',
      label: 'summer time: "Z" wall-clock read as Paris (UTC+2)',
    },
    { expectedOutput: '2026-01-10T09:00:00.000Z', input: '2026-01-10T10:00:00.000Z', label: 'winter time: Paris is UTC+1' },
    {
      expectedOutput: '2026-09-15T08:17:33.000Z',
      input: '2026-09-15T10:17:33.000+02:00',
      label: 'events endpoint: explicit offset is trusted',
    },
    { expectedOutput: '2026-09-16T15:41:43.000Z', input: '2026-09-16T15:41:43+00:00', label: 'explicit +00:00 offset is trusted as UTC' },
    { expectedOutput: '2026-09-16T13:41:43.000Z', input: '2026-09-16T15:41:43', label: 'no suffix' },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(parseBrevoDate(input).toISOString()).toStrictEqual(expectedOutput);
  });
});
