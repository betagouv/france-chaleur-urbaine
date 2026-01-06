import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { type Interval, intervalsEqual } from './interval';

describe('intervalsEqual()', () => {
  type IntervalTestCase = TestCase<{ a: Interval; b: Interval }, boolean>;

  const testCases: IntervalTestCase[] = [
    {
      expectedOutput: true,
      input: {
        a: [1, 2],
        b: [1, 2],
      },
      label: 'retourne true pour des intervalles identiques [1,2] et [1,2]',
    },
    {
      expectedOutput: false,
      input: {
        a: [1, 2],
        b: [1, 3],
      },
      label: 'retourne false pour des intervalles différents [1,2] et [1,3]',
    },
    {
      expectedOutput: false,
      input: {
        a: [2, 2],
        b: [1, 3],
      },
      label: 'retourne false pour des intervalles différents [2,2] et [1,3]',
    },
    {
      expectedOutput: false,
      input: {
        a: [1, 3],
        b: [2, 2],
      },
      label: 'retourne false pour des intervalles différents [1,3] et [2,2]',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(intervalsEqual(input.a, input.b)).toBe(expectedOutput);
  });
});
