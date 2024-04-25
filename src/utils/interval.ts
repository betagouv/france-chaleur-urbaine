export type Interval = [number, number];

/**
 * Returns true if two intervals are equal, false otherwise.
 */
export function intervalsEqual(a: Interval, b: Interval): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
