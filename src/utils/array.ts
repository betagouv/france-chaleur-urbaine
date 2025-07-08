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

/**
 * Computes the difference between two arrays.
 *
 * This function takes two arrays as input and returns an object with three
 * properties: added, removed, and unchanged. The added property contains
 * elements that are in the new array but not in the old array. The removed
 * property contains elements that are in the old array but not in the new
 * array. The unchanged property contains elements that are common to both
 * arrays.
 *
 * @param oldArray The original array.
 * @param newArray The new array.
 * @returns An object with added, removed, and unchanged properties.
 */
export const diff = (oldArray: string[], newArray: string[]) => {
  const added = newArray.filter((item) => !oldArray.includes(item));
  const removed = oldArray.filter((item) => !newArray.includes(item));
  const unchanged = newArray.filter((item) => oldArray.includes(item));

  return { added, removed, unchanged };
};

/**
 * Compares two arrays for equality.
 *
 * @param array1 First array to compare
 * @param array2 Second array to compare
 * @returns True if arrays have same length and elements, false otherwise
 */
export function arrayEquals<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) {
    return false;
  }

  return array1.every((value, index) => value === array2[index]);
}
