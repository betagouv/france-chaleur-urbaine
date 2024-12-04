import { describe, expect, it } from 'vitest';

import { chunk } from './array';

describe('chunk()', () => {
  it('splits array into equal-sized subarrays', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const result = chunk(input, 2);
    expect(result).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('handles last subarray with fewer elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = chunk(input, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty array for empty input', () => {
    const input: number[] = [];
    const result = chunk(input, 3);
    expect(result).toEqual([]);
  });

  it('returns whole array if chunk size exceeds array length', () => {
    const input = [1, 2, 3];
    const result = chunk(input, 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('works with string arrays', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const result = chunk(input, 2);
    expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('handles chunk size of 1', () => {
    const input = [1, 2, 3];
    const result = chunk(input, 1);
    expect(result).toEqual([[1], [2], [3]]);
  });
});
