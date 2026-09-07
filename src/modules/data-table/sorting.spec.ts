import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { compareSortValues } from './sorting';
import type { SortValue } from './types';

describe('compareSortValues', () => {
  const testCases: TestCase<[SortValue, SortValue], number>[] = [
    { expectedOutput: -1, input: [1, 3], label: 'numbers' },
    { expectedOutput: 1, input: ['élan', 'Ecole'], label: 'strings with accents and case' },
    { expectedOutput: -1, input: ['réseau 2', 'réseau 10'], label: 'numeric-aware strings' },
    { expectedOutput: -1, input: [false, true], label: 'booleans' },
    { expectedOutput: 1, input: [new Date('2024-01-01'), new Date('2023-01-01')], label: 'dates' },
    { expectedOutput: 0, input: [null, 5], label: 'null is neutral (handled by sortUndefined)' },
  ];
  it.each(testCases)('$label', ({ input: [valueA, valueB], expectedOutput }) => {
    expect(Math.sign(compareSortValues(valueA, valueB))).toStrictEqual(expectedOutput);
  });
});
