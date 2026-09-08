import type { SortValue } from './types';

/** Sort value of an arbitrary accessor value: primitives and dates as is, arrays joined, objects unsortable (null). */
export const toSortValue = (value: unknown): SortValue => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return value;
  }
  return Array.isArray(value) ? value.map((item) => String(item)).join(', ') : null;
};

const isEmptySortValue = (value: SortValue): value is null | undefined => value === null || value === undefined;

/**
 * Compares two sort values with nulls last whatever the direction (TanStack only inverts the result of
 * the comparator, so nulls are handled by `sortUndefined` and this comparator maps null to undefined).
 */
export const compareSortValues = (valueA: SortValue, valueB: SortValue): number => {
  if (isEmptySortValue(valueA) || isEmptySortValue(valueB)) {
    return 0;
  }
  if (typeof valueA === 'string' && typeof valueB === 'string') {
    return valueA.localeCompare(valueB, 'fr', { numeric: true, sensitivity: 'base' });
  }
  const numberA = valueA instanceof Date ? valueA.getTime() : Number(valueA);
  const numberB = valueB instanceof Date ? valueB.getTime() : Number(valueB);
  return numberA - numberB;
};
