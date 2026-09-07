import type { SortValue } from './types';

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
