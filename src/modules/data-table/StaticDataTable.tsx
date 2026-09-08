import type { ReactNode } from 'react';

import { DataTable } from './DataTable';
import type { DataTableColumn, RowHeight } from './types';
import { useDataTable } from './useDataTable';

export type StaticDataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  data: Row[];
  rowHeight?: RowHeight;
  caption?: ReactNode;
  className?: string;
  /** Row identity; defaults to the row index. */
  getRowId?: (row: Row, index: number) => string;
};

/**
 * Small read-only table for a handful of rows: no toolbar, no sorting, no virtualization, no state.
 * Same columns API and rendering as `DataTable`; inline `columns`/`data` literals are fine at this size.
 * For hand-written markup (colspan, rowspan) use `TableBasic` instead.
 */
export function StaticDataTable<Row>({ columns, data, rowHeight = 'sm', caption, className, getRowId }: StaticDataTableProps<Row>) {
  const table = useDataTable({ columns, data, getRowId, sortable: false });
  return (
    <DataTable
      table={table}
      rowHeight={rowHeight}
      caption={caption}
      className={className}
      search={false}
      filtersDialog={false}
      virtualize={false}
    />
  );
}
