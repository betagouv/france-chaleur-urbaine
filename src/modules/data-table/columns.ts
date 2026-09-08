import type { ColumnDef } from '@tanstack/react-table';

import { compareSortValues, toSortValue } from './sorting';
import type { DataTableColumn, ResolvedColumn, SortDef } from './types';

const getColumnId = <Row>(column: DataTableColumn<Row>): string => {
  const id = column.id ?? column.accessorKey;
  if (id === undefined) {
    throw new Error('DataTable column needs an id or an accessorKey');
  }
  return id;
};

/** Normalizes column definitions (single accessor, id, header label), dropping hidden ones. */
export const resolveColumns = <Row>(columns: DataTableColumn<Row>[], sortableByDefault = true): ResolvedColumn<Row>[] =>
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
        sortable: column.sortable ?? (sortableByDefault && (column.accessorFn !== undefined || accessorKey !== undefined)),
        sortValue: column.sortValue,
        width: column.width,
      };
    });

/** Sort keys of the table: one per sortable column (accessor or `sortValue`), plus the extra `sorts`. */
export const resolveSortKeys = <Row>(columns: ResolvedColumn<Row>[], sorts: SortDef<Row>[]): SortDef<Row>[] => {
  const columnKeys = columns
    .filter((column) => column.sortable)
    .map((column) => ({
      getValue: column.sortValue ?? ((row: Row) => toSortValue(column.accessor(row))),
      id: column.id,
      label: column.headerLabel,
    }));
  return [...columnKeys, ...sorts.filter((sort) => !columnKeys.some((columnKey) => columnKey.id === sort.id))];
};

/** TanStack columns used for sorting only (rendering reads the resolved columns directly). */
export const toTanstackColumns = <Row>(sortKeys: SortDef<Row>[]): ColumnDef<Row, unknown>[] =>
  sortKeys.map((sortKey) => ({
    // null → undefined so TanStack's `sortUndefined` keeps empties last in both directions
    accessorFn: (row) => sortKey.getValue(row) ?? undefined,
    enableSorting: true,
    id: sortKey.id,
    sortDescFirst: false, // first click always sorts ascending, whatever the value type
    sortingFn: (rowA, rowB, columnId) => compareSortValues(rowA.getValue(columnId), rowB.getValue(columnId)),
    sortUndefined: 'last',
  }));
