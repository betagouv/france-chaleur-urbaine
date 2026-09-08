import {
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type Table,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isDevModeEnabled } from '@/hooks/useDevMode';

import { resolveColumns, resolveSortKeys, toTanstackColumns } from './columns';
import { VIRTUALIZE_THRESHOLD } from './constants';
import {
  applyFilters,
  compactFilterValues,
  computeFacetOptions,
  computeRangeDomain,
  countActiveFilters,
} from './filters/filter-predicates';
import type { FacetOption, FilterDef, FilterValues, FilterValuesOf } from './filters/filter-types';
import { buildSearchIndex, defaultSearchText, matchesSearch } from './search';
import type { DataTableColumn, DataTableSearchOptions, ResolvedColumn, SortDef, UseDataTableOptions } from './types';
import { useDataTableState } from './useDataTableState';

// Stable empty defaults: a fresh `[]` per render would recompute every derived memo.
const EMPTY_FILTERS: never[] = [];
const EMPTY_SORTS: never[] = [];
const indexRowId = (_row: unknown, index: number) => String(index);

// Consecutive renders with a new `columns` identity before the dev-mode warning fires.
const UNSTABLE_COLUMNS_THRESHOLD = 5;

export type DataTableInstance<Row, Filters extends readonly FilterDef<Row>[] = readonly FilterDef<Row>[]> = {
  /** TanStack table (sorting, selection). Rendering and filtering do not go through it. */
  table: Table<Row>;
  columns: ResolvedColumn<Row>[];
  filters: Filters;
  /** Every sort key: sortable columns and extra `sorts`, in that order. */
  sortKeys: SortDef<Row>[];
  data: Row[];
  /** Rows after search, filters and sorting. */
  rows: Row[];
  getRowId: (row: Row, index: number) => string;
  search: string;
  setSearch: (search: string) => void;
  searchOptions: DataTableSearchOptions<Row>;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  filterValues: FilterValuesOf<Row, Filters>;
  setFilterValue: (filterId: string, value: unknown) => void;
  setFilterValues: (values: FilterValuesOf<Row, Filters>) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
  facetOptions: Record<string, FacetOption[]>;
  rangeDomains: Record<string, [number, number] | undefined>;
  enableRowSelection: boolean;
  rowSelection: RowSelectionState;
  /** Scrolls a row into view (virtualized or not); registered by `DataTable` once mounted. */
  scrollToRow: (rowId: string) => void;
  scrollToRowRef: React.MutableRefObject<((rowId: string) => void) | null>;
};

/**
 * Dev-mode guard on large tables: columns recreated on every render re-render every row and recompute the search
 * index; the usual cause is an unstable handler in the columns' `useMemo` dependencies. Small static tables are exempt.
 */
function useUnstableColumnsWarning<Row>(columns: DataTableColumn<Row>[], rowCount: number) {
  const previousColumns = useRef(columns);
  const changes = useRef(0);
  const warned = useRef(false);
  useEffect(() => {
    changes.current = previousColumns.current === columns ? 0 : changes.current + 1;
    previousColumns.current = columns;
    if (!warned.current && rowCount > VIRTUALIZE_THRESHOLD && changes.current >= UNSTABLE_COLUMNS_THRESHOLD && isDevModeEnabled()) {
      warned.current = true;
      console.warn('[DataTable] `columns` changed on every render: memoize them and keep their dependencies stable.');
    }
  });
}

/**
 * Table state and derived data: search index, filters (single pass, facets computed once per data),
 * TanStack sorting and selection. Pair it with `<DataTable table={instance} />`.
 */
export function useDataTable<Row, const Filters extends readonly FilterDef<Row>[] = readonly []>(
  options: UseDataTableOptions<Row, Filters>
): DataTableInstance<Row, Filters> {
  const {
    data,
    columns,
    getRowId = indexRowId,
    initialSorting,
    initialFilters,
    search: searchOptions = {},
    urlKey,
    enableRowSelection = false,
    sortable = true,
  } = options;
  const filters = (options.filters ?? EMPTY_FILTERS) as Filters;
  const sorts: SortDef<Row>[] = options.sorts ?? EMPTY_SORTS;

  const state = useDataTableState(urlKey, initialSorting, initialFilters);
  useUnstableColumnsWarning(columns, data.length);
  const resolvedColumns = useMemo(() => resolveColumns(columns, sortable), [columns, sortable]);
  const sortKeys = useMemo(() => resolveSortKeys(resolvedColumns, sorts), [resolvedColumns, sorts]);
  const tanstackColumns = useMemo(() => toTanstackColumns(sortKeys), [sortKeys]);

  const getSearchText = searchOptions.getText;
  const searchIndex = useMemo(
    () => buildSearchIndex(data, getSearchText ?? ((row) => defaultSearchText(row, resolvedColumns))),
    [data, getSearchText, resolvedColumns]
  );
  const facetOptions = useMemo(
    () =>
      Object.fromEntries(filters.flatMap((filter) => (filter.type === 'facets' ? [[filter.id, computeFacetOptions(filter, data)]] : []))),
    [filters, data]
  );
  const rangeDomains = useMemo(
    () => Object.fromEntries(filters.flatMap((filter) => (filter.type === 'range' ? [[filter.id, computeRangeDomain(filter, data)]] : []))),
    [filters, data]
  );

  const filteredData = useMemo(() => {
    const searched = state.search ? data.filter((_, index) => matchesSearch(searchIndex[index], state.search)) : data;
    return applyFilters(searched, filters, state.filterValues);
  }, [data, searchIndex, state.search, filters, state.filterValues]);

  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
  const rowSelection = options.rowSelection ?? internalSelection;
  const onRowSelectionChange = options.onRowSelectionChange ?? setInternalSelection;

  const table = useReactTable({
    // No pagination: TanStack would otherwise reset the page index (a setState) whenever the sorted row model
    // recomputes, which turns unstable columns into an infinite render loop.
    autoResetPageIndex: false,
    columns: tanstackColumns,
    data: filteredData,
    enableMultiSort: true,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: (updater) => onRowSelectionChange(typeof updater === 'function' ? updater(rowSelection) : updater),
    onSortingChange: (updater) => state.setSorting(typeof updater === 'function' ? updater(state.sorting) : updater),
    state: { rowSelection, sorting: state.sorting },
  });

  const sortedRowModel = table.getRowModel();
  const rows = useMemo(() => sortedRowModel.rows.map((row) => row.original), [sortedRowModel]);

  const setFilterValues = useCallback(
    (values: FilterValues) => state.setFilterValues(compactFilterValues(values)),
    [state.setFilterValues]
  );
  const setFilterValue = useCallback(
    (filterId: string, value: unknown) => setFilterValues({ ...state.filterValues, [filterId]: value }),
    [setFilterValues, state.filterValues]
  );
  const resetFilters = useCallback(() => setFilterValues({}), [setFilterValues]);

  const scrollToRowRef = useRef<((rowId: string) => void) | null>(null);
  const scrollToRow = useCallback((rowId: string) => scrollToRowRef.current?.(rowId), []);

  return {
    activeFiltersCount: countActiveFilters(state.filterValues),
    columns: resolvedColumns,
    data,
    enableRowSelection,
    facetOptions,
    filters,
    filterValues: state.filterValues as FilterValuesOf<Row, Filters>,
    getRowId,
    rangeDomains,
    resetFilters,
    rowSelection,
    rows,
    scrollToRow,
    scrollToRowRef,
    search: state.search,
    searchOptions,
    setFilterValue,
    setFilterValues,
    setSearch: state.setSearch,
    setSorting: state.setSorting,
    sorting: state.sorting,
    sortKeys,
    table,
  };
}
