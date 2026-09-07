import type { ColumnDef } from '@tanstack/react-table';

import { compareSortValues } from './sorting';
import type { DataTableColumn, ResolvedColumn } from './types';

const getColumnId = <Row>(column: DataTableColumn<Row>): string => {
  const id = column.id ?? column.accessorKey;
  if (id === undefined) {
    throw new Error('DataTable column needs an id or an accessorKey');
  }
  return id;
};

/** Normalizes column definitions (single accessor, id, header label), dropping hidden ones. */
export const resolveColumns = <Row>(columns: DataTableColumn<Row>[]): ResolvedColumn<Row>[] =>
  columns
    .filter((column) => !column.hidden)
    .map((column) => {
      const id = getColumnId(column);
      const accessorKey = column.accessorKey;
      const accessor = column.accessorFn ?? (accessorKey === undefined ? () => undefined : (row: Row) => row[accessorKey]);
      return {
        accessor,
        align: column.align ?? 'left',
        cell: column.cell,
        className: column.className,
        export: column.export ?? {},
        header: column.header,
        headerLabel: column.headerLabel ?? (typeof column.header === 'string' ? column.header : id),
        id,
        sortable: column.sortable ?? (column.accessorFn !== undefined || accessorKey !== undefined),
        sortValue: column.sortValue,
        width: column.width,
      };
    });

/** TanStack columns used for sorting only (rendering reads the resolved columns directly). */
export const toTanstackColumns = <Row>(columns: ResolvedColumn<Row>[]): ColumnDef<Row, unknown>[] =>
  columns.map((column) => {
    const sortAccessor = column.sortValue ?? column.accessor;
    return {
      // null → undefined so TanStack's `sortUndefined` keeps empties last in both directions
      accessorFn: (row) => sortAccessor(row) ?? undefined,
      enableSorting: column.sortable,
      id: column.id,
      sortDescFirst: false, // first click always sorts ascending, whatever the value type
      sortingFn: (rowA, rowB, columnId) => compareSortValues(rowA.getValue(columnId), rowB.getValue(columnId)),
      sortUndefined: 'last',
    };
  });
