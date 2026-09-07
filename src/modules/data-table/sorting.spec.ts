import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { compareSortValues } from './sorting';
import type { SortValue } from './types';

describe('compareSortValues', () => {
  const cases: TestCase<[SortValue, SortValue], number>[] = [
    ['numbers', [1, 3], -2],
    ['strings with accents and case', ['élan', 'Ecole'], 1],
    ['numeric-aware strings', ['réseau 2', 'réseau 10'], -1],
    ['booleans', [false, true], -1],
    ['dates', [new Date('2024-01-01'), new Date('2023-01-01')], 86400000 * 365],
    ['null is neutral (handled by sortUndefined)', [null, 5], 0],
  ];
  it.each(cases)('%s', (_, [valueA, valueB], expected) =>
    expect(Math.sign(compareSortValues(valueA, valueB))).toStrictEqual(Math.sign(expected)));
});
