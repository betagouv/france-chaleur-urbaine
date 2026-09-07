import type { SortingState } from '@tanstack/react-table';
import { parseAsJson, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import type { FilterValues } from './filters/filter-types';

const parseSorting = (value: unknown): SortingState => (Array.isArray(value) ? (value as SortingState) : []);
const parseFilters = (value: unknown): FilterValues =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as FilterValues) : {};

// Key used when the table is not URL-synced: the hook must still be called, its params stay untouched.
const UNSYNCED_PREFIX = '__data_table_unsynced__';

export type DataTableState = {
  search: string;
  setSearch: (search: string) => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  filterValues: FilterValues;
  setFilterValues: (values: FilterValues) => void;
};

/**
 * Search / sorting / filter values of a table, kept in the URL (`<urlKey>_search|_sort|_filters`)
 * when `urlKey` is given, in local state otherwise. Initial values apply only when the URL has none.
 */
export function useDataTableState(
  urlKey: string | undefined,
  initialSorting: SortingState | undefined,
  initialFilters: FilterValues | undefined
): DataTableState {
  const prefix = urlKey ?? UNSYNCED_PREFIX;
  const parsers = useMemo(
    () => ({
      filters: parseAsJson(parseFilters).withDefault(initialFilters ?? {}),
      search: parseAsString.withDefault(''),
      sort: parseAsJson(parseSorting).withDefault(initialSorting ?? []),
    }),
    [initialFilters, initialSorting]
  );
  const [urlState, setUrlState] = useQueryStates(parsers, {
    urlKeys: { filters: `${prefix}_filters`, search: `${prefix}_search`, sort: `${prefix}_sort` },
  });

  const [localSearch, setLocalSearch] = useState('');
  const [localSorting, setLocalSorting] = useState<SortingState>(initialSorting ?? []);
  const [localFilterValues, setLocalFilterValues] = useState<FilterValues>(initialFilters ?? {});

  const setSearch = useCallback(
    (search: string) => (urlKey ? void setUrlState({ search: search || null }) : setLocalSearch(search)),
    [urlKey, setUrlState]
  );
  const setSorting = useCallback(
    (sorting: SortingState) => (urlKey ? void setUrlState({ sort: sorting.length > 0 ? sorting : null }) : setLocalSorting(sorting)),
    [urlKey, setUrlState]
  );
  const setFilterValues = useCallback(
    (values: FilterValues) =>
      urlKey ? void setUrlState({ filters: Object.keys(values).length > 0 ? values : null }) : setLocalFilterValues(values),
    [urlKey, setUrlState]
  );

  return urlKey
    ? { filterValues: urlState.filters, search: urlState.search, setFilterValues, setSearch, setSorting, sorting: urlState.sort }
    : { filterValues: localFilterValues, search: localSearch, setFilterValues, setSearch, setSorting, sorting: localSorting };
}
