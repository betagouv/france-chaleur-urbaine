import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { chunk, isOneOf } from './array';

describe('isOneOf()', () => {
  it('returns true when value is in the array', () => {
    expect(isOneOf('b', ['a', 'b', 'c'] as const)).toBe(true);
  });

  it('returns false when value is not in the array', () => {
    expect(isOneOf('d', ['a', 'b', 'c'] as const)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isOneOf('a', [] as const)).toBe(false);
  });
});

describe('chunk()', () => {
  type ChunkTestCase = TestCase<{ array: any[]; size: number }, any[][]>;

  const testCases: ChunkTestCase[] = [
    {
      expectedOutput: [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
      input: { array: [1, 2, 3, 4, 5, 6], size: 2 },
      label: 'splits array into equal-sized subarrays',
    },
    {
      expectedOutput: [[1, 2], [3, 4], [5]],
      input: { array: [1, 2, 3, 4, 5], size: 2 },
      label: 'handles last subarray with fewer elements',
    },
    {
      expectedOutput: [],
      input: { array: [], size: 3 },
      label: 'returns empty array for empty input',
    },
    {
      expectedOutput: [[1, 2, 3]],
      input: { array: [1, 2, 3], size: 5 },
      label: 'returns whole array if chunk size exceeds array length',
    },
    {
      expectedOutput: [['a', 'b'], ['c', 'd'], ['e']],
      input: { array: ['a', 'b', 'c', 'd', 'e'], size: 2 },
      label: 'works with string arrays',
    },
    {
      expectedOutput: [[1], [2], [3]],
      input: { array: [1, 2, 3], size: 1 },
      label: 'handles chunk size of 1',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(chunk(input.array, input.size)).toEqual(expectedOutput);
  });
});
