import { type ReactNode, useCallback, useMemo, useRef } from 'react';

import cx from '@/utils/cx';

import {
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_TABLE_HEIGHT,
  LOADING_ROWS_COUNT,
  ROW_HEIGHTS,
  SELECTION_COLUMN_WIDTH,
  VIRTUALIZE_THRESHOLD,
} from './constants';
import { DataTableBody } from './DataTableBody';
import { DataTableHeaderCell } from './DataTableHeaderCell';
import type { ExportConfig } from './export';
import type { FilterDef } from './filters/filter-types';
import { DataTableToolbar } from './toolbar/DataTableToolbar';
import type { DataTablePreset, RowHeight } from './types';
import type { DataTableInstance } from './useDataTable';

export type DataTableProps<Row, Filters extends readonly FilterDef<Row>[]> = {
  table: DataTableInstance<Row, Filters>;
  /** Fixed height of every row: one, two or three lines of content. */
  rowHeight?: RowHeight;
  /** `auto` virtualizes above 100 rows; virtualized tables scroll inside `height`. */
  virtualize?: boolean | 'auto';
  /** Max height of the scroll container (any CSS length); only applies when virtualized. */
  height?: string;
  loading?: boolean;
  emptyMessage?: string;
  caption?: ReactNode;
  className?: string;
  /** Highlights a row without selecting it (map ↔ table links). */
  selectedRowId?: string | null;
  onRowClick?: (row: Row) => void;
  onRowDoubleClick?: (row: Row) => void;
  search?: boolean;
  /** Defaults to true when the table has filters. */
  filtersDialog?: boolean;
  sortDialog?: boolean;
  presets?: DataTablePreset<Row, Filters>[];
  exportConfig?: ExportConfig<Row>;
  /** Extra buttons at the right of the toolbar. */
  actions?: ReactNode;
};

/**
 * Data table rendering of a `useDataTable` instance: toolbar, sticky header, fixed-height rows,
 * automatic virtualization for large datasets. Same DOM (`<table>`) in both render modes.
 */
export function DataTable<Row, Filters extends readonly FilterDef<Row>[]>({
  table,
  rowHeight = 'md',
  virtualize = 'auto',
  height = DEFAULT_TABLE_HEIGHT,
  loading = false,
  emptyMessage = 'Aucun résultat',
  caption,
  className,
  selectedRowId,
  onRowClick,
  onRowDoubleClick,
  search = true,
  filtersDialog = table.filters.length > 0,
  sortDialog = false,
  presets,
  exportConfig,
  actions,
}: DataTableProps<Row, Filters>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const virtualized = virtualize === 'auto' ? table.rows.length > VIRTUALIZE_THRESHOLD : virtualize;

  // Stable handlers so unstable callbacks from the page never invalidate the memoized rows.
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const onRowDoubleClickRef = useRef(onRowDoubleClick);
  onRowDoubleClickRef.current = onRowDoubleClick;
  const handleRowClick = useCallback((row: Row) => onRowClickRef.current?.(row), []);
  const handleRowDoubleClick = useCallback((row: Row) => onRowDoubleClickRef.current?.(row), []);

  const hasExplicitWidths = table.columns.some((column) => column.width !== undefined);
  const minWidth = useMemo(
    () =>
      table.columns.reduce((total, column) => total + (typeof column.width === 'number' ? column.width : DEFAULT_COLUMN_MIN_WIDTH), 0) +
      (table.enableRowSelection ? SELECTION_COLUMN_WIDTH : 0),
    [table.columns, table.enableRowSelection]
  );
  const columnCount = table.columns.length + (table.enableRowSelection ? 1 : 0);
  const hasToolbar = search || filtersDialog || sortDialog || (presets && presets.length > 0) || exportConfig || actions;

  return (
    <section className={className}>
      {hasToolbar && (
        <DataTableToolbar
          table={table}
          search={search}
          filtersDialog={filtersDialog}
          sortDialog={sortDialog}
          presets={presets}
          exportConfig={exportConfig}
          actions={actions}
          loading={loading}
        />
      )}
      {caption && <div className="text-2xl leading-8 font-bold mb-5">{caption}</div>}
      <div
        ref={scrollContainerRef}
        className="fr-table fr-table--no-scroll my-0! relative overflow-auto scrollbar-visible"
        style={virtualized ? { maxHeight: height } : undefined}
      >
        <table className={cx('w-full mt-px', hasExplicitWidths ? 'table-fixed' : 'table-auto')} style={{ minWidth }}>
          <colgroup>
            {table.enableRowSelection && <col style={{ width: SELECTION_COLUMN_WIDTH }} />}
            {table.columns.map((column) => (
              <col key={column.id} style={column.width !== undefined ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-1">
            <tr>
              {table.enableRowSelection && (
                <th scope="col" className="px-2 text-center!">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer"
                    aria-label="Tout sélectionner"
                    checked={table.table.getIsAllRowsSelected()}
                    onChange={table.table.getToggleAllRowsSelectedHandler()}
                  />
                </th>
              )}
              {table.columns.map((column) => (
                <DataTableHeaderCell
                  key={column.id}
                  column={column}
                  tanstackColumn={table.table.getColumn(column.id)}
                  sortingCount={table.sorting.length}
                />
              ))}
            </tr>
          </thead>
          {loading ? (
            <tbody>
              {Array.from({ length: LOADING_ROWS_COUNT }, (_, index) => (
                <tr key={index} style={{ height: ROW_HEIGHTS[rowHeight] }}>
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex} className="px-2">
                      <div className="animate-pulse h-3.5 rounded-full bg-gray-200 w-[90%]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : table.rows.length === 0 ? (
            <tbody>
              <tr style={{ height: ROW_HEIGHTS[rowHeight] }}>
                <td colSpan={columnCount} className="px-2 text-left!">
                  {table.data.length === 0 ? emptyMessage : 'Aucun résultat trouvé, élargissez votre recherche'}
                </td>
              </tr>
            </tbody>
          ) : (
            <DataTableBody
              table={table}
              rowHeight={rowHeight}
              virtualized={virtualized}
              scrollContainerRef={scrollContainerRef}
              selectedRowId={selectedRowId}
              onRowClick={onRowClick ? handleRowClick : undefined}
              onRowDoubleClick={onRowDoubleClick ? handleRowDoubleClick : undefined}
            />
          )}
        </table>
      </div>
    </section>
  );
}
