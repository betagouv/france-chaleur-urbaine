import { normalize } from '@/utils/strings';

import {
  type DateRangeFilterValue,
  EMPTY_FACET_KEY,
  type FacetOption,
  type FacetsFilterDef,
  type FacetValue,
  type FilterDef,
  type FilterValues,
  type RangeFilterDef,
} from './filter-types';

const DEFAULT_MIN_DATE = '1900-01-01';
const DEFAULT_MAX_DATE = '2100-12-31';

const isEmptyValue = (value: unknown): boolean => value === null || value === undefined || value === '';

/** Converts a raw facet value to its option key (booleans, numbers and empties get a stable string form). */
export const toFacetKey = (value: FacetValue): string => (isEmptyValue(value) ? EMPTY_FACET_KEY : String(value));

const toFacetKeys = (value: FacetValue | FacetValue[]): string[] =>
  Array.isArray(value) ? (value.length === 0 ? [EMPTY_FACET_KEY] : value.map(toFacetKey)) : [toFacetKey(value)];

const toIsoDate = (value: string | Date): string => (value instanceof Date ? value.toISOString() : value);

/** Returns true when the row passes the filter; an `undefined` value means the filter is inactive. */
export const matchesFilter = <Row>(filter: FilterDef<Row>, row: Row, value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }
  switch (filter.type) {
    case 'facets': {
      const selected = value as string[];
      return selected.length === 0 || toFacetKeys(filter.getValue(row)).some((key) => selected.includes(key));
    }
    case 'range': {
      const [min, max] = value as [number, number];
      const rowValue = filter.getValue(row);
      return rowValue !== null && rowValue !== undefined && rowValue >= min && rowValue <= max;
    }
    case 'dateRange': {
      const range = value as DateRangeFilterValue;
      const rowValue = filter.getValue(row);
      if (rowValue === null || rowValue === undefined || rowValue === '') {
        return range.includeEmpty === true;
      }
      const isoDate = toIsoDate(rowValue);
      // Compare on the date part so a `to` bound of the same day matches a datetime value.
      return isoDate.slice(0, 10) >= (range.from || DEFAULT_MIN_DATE) && isoDate.slice(0, 10) <= (range.to || DEFAULT_MAX_DATE);
    }
    case 'text': {
      const query = normalize(value as string);
      return query === '' || normalize(filter.getValue(row)).includes(query);
    }
    case 'emptyOrFilled': {
      const rowValue = filter.getValue(row);
      const isFilled = !isEmptyValue(rowValue) && !(Array.isArray(rowValue) && rowValue.length === 0);
      return value === 'filled' ? isFilled : !isFilled;
    }
    case 'custom':
      return filter.predicate(row, value);
  }
};

/** Applies every active filter in a single pass. */
export const applyFilters = <Row>(rows: Row[], filters: readonly FilterDef<Row>[], values: FilterValues): Row[] => {
  const activeFilters = filters.filter((filter) => values[filter.id] !== undefined);
  return activeFilters.length === 0
    ? rows
    : rows.filter((row) => activeFilters.every((filter) => matchesFilter(filter, row, values[filter.id])));
};

/** Facet options with their occurrences, sorted alphabetically with « Aucun » last. */
export const computeFacetOptions = <Row>(filter: FacetsFilterDef<Row>, rows: Row[]): FacetOption[] => {
  const counts = rows.reduce((accumulator, row) => {
    toFacetKeys(filter.getValue(row)).forEach((key) => accumulator.set(key, (accumulator.get(key) ?? 0) + 1));
    return accumulator;
  }, new Map<string, number>());
  return [...counts.entries()]
    .map(([key, count]) => ({ count, key }))
    .sort((optionA, optionB) =>
      optionA.key === EMPTY_FACET_KEY
        ? 1
        : optionB.key === EMPTY_FACET_KEY
          ? -1
          : optionA.key.localeCompare(optionB.key, 'fr', { numeric: true })
    );
};

/** Min/max of the numeric values of the data, or the declared domain; `undefined` when no value exists. */
export const computeRangeDomain = <Row>(filter: RangeFilterDef<Row>, rows: Row[]): [number, number] | undefined => {
  if (filter.domain) {
    return filter.domain;
  }
  const values = rows
    .map((row) => filter.getValue(row))
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
  return values.length === 0 ? undefined : [Math.min(...values), Math.max(...values)];
};

/** Number of filters holding a value. */
export const countActiveFilters = (values: FilterValues): number => Object.values(values).filter((value) => value !== undefined).length;

/** Drops inactive entries so the state stays minimal (URL, equality checks). */
export const compactFilterValues = (values: FilterValues): FilterValues =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));

const stableStringify = (value: unknown): string =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
        .join(',')}}`
    : JSON.stringify(value);

/** Structural equality of two filter value sets, ignoring inactive entries and key order. */
export const areFilterValuesEqual = (valuesA: FilterValues, valuesB: FilterValues): boolean =>
  stableStringify(compactFilterValues(valuesA)) === stableStringify(compactFilterValues(valuesB));
