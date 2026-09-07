import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import type { FilterDef, FilterValuesOf } from './filters/filter-types';

export type SortValue = string | number | boolean | Date | null | undefined;

export type CellContext<Row, Value = unknown> = {
  row: Row;
  value: Value;
};

export type CellRenderer<Row, Value = unknown> = (context: CellContext<Row, Value>) => ReactNode;

export type ColumnAlign = 'left' | 'center' | 'right';

/** Number = pixels; string = any CSS width (`'20%'`, `'12rem'`). Columns without width share the remaining space. */
export type ColumnWidth = number | string;

export type ColumnExport<Row> =
  | false
  | {
      header?: string;
      value?: (row: Row) => string | number | boolean | null | undefined;
    };

type ColumnBase<Row> = {
  /** Required when the column has no `accessorKey`. Also the id used by sorting and URL state. */
  id?: string;
  header: ReactNode;
  /** Plain-text header, used for the sort dialog and the export when `header` is not a string. */
  headerLabel?: string;
  align?: ColumnAlign;
  className?: string;
  width?: ColumnWidth;
  sortable?: boolean;
  /** Value used for sorting instead of the accessor value (multi-value cells, custom order). Nulls sort last. */
  sortValue?: (row: Row) => SortValue;
  export?: ColumnExport<Row>;
  /** Hidden columns are neither rendered nor exported; useful to keep a definition around without showing it. */
  hidden?: boolean;
};

type AccessorKeyColumn<Row> = {
  [Key in keyof Row & string]: ColumnBase<Row> & {
    accessorKey: Key;
    accessorFn?: never;
    cell?: CellRenderer<Row, Row[Key]>;
  };
}[keyof Row & string];

type AccessorFnColumn<Row, Value> = ColumnBase<Row> & {
  id: string;
  accessorKey?: never;
  accessorFn: (row: Row) => Value;
  cell?: CellRenderer<Row, Value>;
};

type DisplayColumn<Row> = ColumnBase<Row> & {
  id: string;
  accessorKey?: never;
  accessorFn?: never;
  cell: CellRenderer<Row, undefined>;
  sortable?: false;
};

export type DataTableColumn<Row, Value = unknown> = AccessorKeyColumn<Row> | AccessorFnColumn<Row, Value> | DisplayColumn<Row>;

/** Internal normalized column: single accessor and id, whatever the definition style. */
export type ResolvedColumn<Row> = {
  id: string;
  header: ReactNode;
  headerLabel: string;
  accessor: (row: Row) => unknown;
  /** Method signature (bivariant): the typed `cell` of the definition fits here, the accessor guarantees its value type. */
  cell?(context: CellContext<Row, unknown>): ReactNode;
  align: ColumnAlign;
  className?: string;
  width?: ColumnWidth;
  sortable: boolean;
  sortValue?: (row: Row) => SortValue;
  export: ColumnExport<Row>;
};

export type RowHeight = 'sm' | 'md' | 'lg';

export type DataTablePreset<Row, Filters extends readonly FilterDef<Row>[]> = {
  id: string;
  label: ReactNode;
  valueSuffix?: ReactNode;
  /** Filter values applied when the preset is activated; an empty object clears every filter. */
  filters: FilterValuesOf<Row, Filters>;
  /** Count displayed on the preset, computed on the unfiltered data. */
  getCount?: (rows: Row[]) => number;
};

export type DataTableSearchOptions<Row> = {
  placeholder?: string;
  /** Text indexed for the global search; defaults to every string/number/string[] column value. */
  getText?: (row: Row) => string;
};

export type UseDataTableOptions<Row, Filters extends readonly FilterDef<Row>[]> = {
  data: Row[];
  columns: DataTableColumn<Row>[];
  filters?: Filters;
  getRowId: (row: Row) => string;
  initialSorting?: SortingState;
  initialFilters?: FilterValuesOf<Row, Filters>;
  search?: DataTableSearchOptions<Row>;
  /** Prefix of the URL query params (`<urlKey>_search`, `<urlKey>_sort`, `<urlKey>_filters`). Local state when omitted. */
  urlKey?: string;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
};
