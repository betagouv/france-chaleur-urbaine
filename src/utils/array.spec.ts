import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { chunk } from './array';

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
