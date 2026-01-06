import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import convertPointToCoordinates from './convertPointToCoordinates';

describe('convertPointToCoordinates()', () => {
  type PointTestCase = TestCase<[number, number], { lat: number; lon: number }>;

  const testCases: PointTestCase[] = [
    {
      expectedOutput: { lat: 2, lon: 1 },
      input: [1, 2],
      label: 'converts [1, 2] to { lon: 1, lat: 2 }',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(convertPointToCoordinates(input)).toStrictEqual(expectedOutput);
  });
});
