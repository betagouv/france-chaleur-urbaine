import {
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type Table,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback, useMemo, useRef, useState } from 'react';

import { resolveColumns, toTanstackColumns } from './columns';
import {
  applyFilters,
  compactFilterValues,
  computeFacetOptions,
  computeRangeDomain,
  countActiveFilters,
} from './filters/filter-predicates';
import type { FacetOption, FilterDef, FilterValues, FilterValuesOf } from './filters/filter-types';
import { buildSearchIndex, defaultSearchText, matchesSearch } from './search';
import type { DataTableSearchOptions, ResolvedColumn, UseDataTableOptions } from './types';
import { useDataTableState } from './useDataTableState';

export type DataTableInstance<Row, Filters extends readonly FilterDef<Row>[] = readonly FilterDef<Row>[]> = {
  /** TanStack table (sorting, selection). Rendering and filtering do not go through it. */
  table: Table<Row>;
  columns: ResolvedColumn<Row>[];
  filters: Filters;
  data: Row[];
  /** Rows after search, filters and sorting. */
  rows: Row[];
  getRowId: (row: Row) => string;
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
 * Table state and derived data: search index, filters (single pass, facets computed once per data),
 * TanStack sorting and selection. Pair it with `<DataTable table={instance} />`.
 */
export function useDataTable<Row, const Filters extends readonly FilterDef<Row>[] = readonly []>(
  options: UseDataTableOptions<Row, Filters>
): DataTableInstance<Row, Filters> {
  const {
    data,
    columns,
    getRowId,
    initialSorting,
    initialFilters,
    search: searchOptions = {},
    urlKey,
    enableRowSelection = false,
  } = options;
  const filters = (options.filters ?? []) as Filters;

  const state = useDataTableState(urlKey, initialSorting, initialFilters);
  const resolvedColumns = useMemo(() => resolveColumns(columns), [columns]);
  const tanstackColumns = useMemo(() => toTanstackColumns(resolvedColumns), [resolvedColumns]);

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
    table,
  };
}
