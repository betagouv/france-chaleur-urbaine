import type { ResolvedColumn } from './types';

export type ExportValue = string | number | boolean | null | undefined;

export type ExportColumn<Row> = {
  header: string;
  value: (row: Row) => ExportValue;
};

export type ExportConfig<Row> = {
  fileName: string;
  sheetName: string;
  /** Columns exported in addition to the visible ones (values not shown in the table). */
  extraColumns?: ExportColumn<Row>[];
};

const toExportValue = (value: unknown): ExportValue => {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  return typeof value === 'object' ? JSON.stringify(value) : (value as string | number | boolean);
};

/** Export columns derived from the table columns (`export: false` excludes, `export.value` overrides). */
export const buildExportColumns = <Row>(columns: ResolvedColumn<Row>[], extraColumns: ExportColumn<Row>[] = []): ExportColumn<Row>[] => [
  ...columns.flatMap((column) => {
    if (column.export === false) {
      return [];
    }
    const valueFn = column.export.value;
    return [
      {
        header: column.export.header ?? column.headerLabel,
        value: valueFn ?? ((row: Row) => toExportValue(column.accessor(row))),
      },
    ];
  }),
  ...extraColumns,
];

/** Sheet ready for `exportAsXLSX`. */
export const buildExportSheet = <Row>(columns: ExportColumn<Row>[], rows: Row[], sheetName: string) => ({
  columns: columns.map((column) => ({
    accessorFn: (row: Row) => column.value(row) ?? '',
    name: column.header,
  })),
  data: rows,
  name: sheetName,
});
