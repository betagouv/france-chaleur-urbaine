export const shuffleArray = <T extends object>(array: T[]): T[] => {
  return array
    .map((item) => ({ ...item, sort: Math.random() }))
    .sort((a, b) => (a as any).sort - (b as any).sort)
    .map(({ sort, ...rest }) => rest as T);
};

/**
 * Splits an array into smaller arrays of specified size.
 *
 * @template T Type of array elements
 * @param array Array to be chunked
 * @param size Maximum size of each chunk
 * @returns Array of chunk arrays
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5, 6, 7];
 * const chunked = chunk(numbers, 3);
 * // [[1, 2, 3], [4, 5, 6], [7]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
