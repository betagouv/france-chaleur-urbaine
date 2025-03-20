import { fr } from '@codegouvfr/react-dsfr';
import Input from '@codegouvfr/react-dsfr/Input';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef as ColumnDefOriginal,
  type SortingFn,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type FilterFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cva } from 'class-variance-authority';
import React from 'react';

import { isDevModeEnabled } from '@/hooks/useDevMode';
import cx from '@/utils/cx';

import TableCell, { type TableCellProps } from './TableCell';

export const customSortingFn = <T extends RowData>(): Record<string, SortingFn<T>> => ({
  nullsLast: (rowA: any, rowB: any, columnId: string) => {
    const valueA = rowA.getValue(columnId);
    const valueB = rowB.getValue(columnId);
    return valueA === null ? 1 : valueB === null ? -1 : valueA - valueB;
  },
});

export const customFilterFn = <T extends RowData>(): Record<string, FilterFn<T>> => ({
  notNullAndGreaterThanOrEqual: (row, columnId, filterValue: number) => {
    const value = row.getValue<number>(columnId);
    return value != null && value >= filterValue;
  },
  notNullAndLessThanOrEqual: (row, columnId, filterValue: number) => {
    const value = row.getValue<number>(columnId);
    return value != null && value <= filterValue;
  },
});

export type ColumnDef<T, K = any> = ColumnDefOriginal<T, K> & {
  cellType?: TableCellProps<T>['type'];
  align?: 'center' | 'left' | 'right';
  className?: string;
  suffix?: React.ReactNode;
  sorting?: keyof ReturnType<typeof customSortingFn<T>>;
  filter?: keyof ReturnType<typeof customFilterFn<T>>;
} & ({ flex?: number } | { width?: 'auto' | string });

export type TableSimpleProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  initialSortingState?: SortingState;
  columnFilters?: ColumnFiltersState;
  loading?: boolean;
  caption?: string;
  enableRowSelection?: boolean;
  className?: string;
  fluid?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onSelectionChange?: (selectedRows: T[]) => void;
  maxRowHeight?: number;
};

const cellCustomClasses = cva('', {
  variants: {
    padding: {
      sm: '!p-2',
      md: '',
      lg: '!p-6',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

const TableSimple = <T extends RowData>({
  data,
  columns,
  initialSortingState,
  columnFilters,
  loading,
  caption,
  enableRowSelection,
  onSelectionChange,
  className,
  fluid,
  padding = 'md',
  maxRowHeight = 64,
}: TableSimpleProps<T>) => {
  const [globalFilter, setGlobalFilter] = React.useState<any>([]);
  const [sortingState, setSortingState] = React.useState<SortingState>(initialSortingState ?? []);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const columnClassName = ({ align, className }: ColumnDef<T>) => {
    const classNames = [];

    if (align === 'left') classNames.push('!text-left justify-start'); // need the ! to bypass DSFR
    if (align === 'right') classNames.push('!text-right justify-end');
    if (align === 'center') classNames.push('!text-center justify-center');

    if (className) classNames.push(className);

    return classNames.join(' ');
  };

  const cellRender = (cell: Cell<T, unknown>) => {
    const { suffix, cellType, ...columnDef } = cell.column.columnDef as ColumnDef<T>;
    const value = cell.getValue();
    return (
      <>
        <TableCell<T>
          type={cellType}
          value={value}
          default={flexRender(columnDef.cell, cell.getContext())}
          data={cell.row.original}
          {...columnDef}
        />
        {value ? suffix : ''}
      </>
    );
  };

  const selectionColumn: ColumnDef<T> = {
    id: 'selection',
    header: ({ table }) => (
      <div className="fr-checkbox-group fr-checkbox-group--sm">
        <input
          type="checkbox"
          id="select-all"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          title="Tout sélectionner"
        />
        <label className="fr-label" htmlFor="select-all" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="fr-checkbox-group fr-checkbox-group--sm">
        <input
          type="checkbox"
          id={`select-row-${row.id}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          data-fr-row-select="true"
          title="Sélectionner la ligne"
        />
        <label className="fr-label" htmlFor={`select-row-${row.id}`} />
      </div>
    ),
    flex: 0,
  };

  const tableColumns = React.useMemo(() => {
    if (enableRowSelection) {
      return [selectionColumn, ...columns];
    }
    return columns;
  }, [columns, enableRowSelection]);

  const customSortingFns = customSortingFn<T>();
  const customFilterFns = customFilterFn<T>();
  tableColumns.forEach((column) => {
    if (column.sorting && customSortingFns[column.sorting]) {
      column.sortingFn = customSortingFns[column.sorting];
    }
    if (column.filter && customFilterFns[column.filter]) {
      column.filterFn = customFilterFns[column.filter];
    }
  });

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: sortingState,
      globalFilter,
      columnFilters,
      rowSelection,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSortingState,
    debugTable: isDevModeEnabled(),
  });

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  const { rows } = table.getRowModel();
  const { rows: filteredRows } = table.getFilteredRowModel();

  // the virtualizer needs to know the scrollable container element
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => maxRowHeight, // estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10, // The number of items to render above and below the visible area
  });

  const gridTemplateColumns = table
    .getHeaderGroups()[0]
    .headers.map((header, index) => {
      const columnDef = header.column.columnDef as ColumnDef<T>;
      const sizeValue = (columnDef as any)?.width ?? `${(columnDef as any)?.flex ?? 1}fr`; // TOFIX: remove any but could not find a way to do it
      return enableRowSelection && index === 0 ? 'auto' : sizeValue;
    })
    .join(' ');
  const hasAtLeastOneColumnSorting = table.getHeaderGroups()[0].headers.some((header) => header.column.getCanSort());

  return (
    <section>
      <Input
        label=""
        nativeInputProps={{
          value: globalFilter,
          onChange: (e) => table.setGlobalFilter(e.target.value),
          placeholder: 'Recherche...',
        }}
      />
      {caption && <div className="text-2xl leading-8 font-bold mb-5">{caption}</div>}
      <div
        className={fr.cx('fr-table', 'fr-table--no-scroll')}
        ref={tableContainerRef}
        style={{
          overflow: 'overlay', // our scrollable table container
          position: 'relative', // needed for sticky header
          maxHeight: '600px', // should be a fixed height
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table
          className={cx(fluid ? '!w-[max-content]' : '', className)}
          style={{
            display: 'grid',
            overflow: 'unset', // overwrite the dsfr
            marginTop: '1px', // make top border visible as overflow hides it
          }}
        >
          <thead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ gridTemplateColumns }} className="grid w-full">
                {headerGroup.headers.map((header) => {
                  const columnDef = header.column.columnDef as ColumnDef<T>;
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cx(
                        '!flex flex-nowrap items-center overflow-auto gap-1',
                        columnClassName(columnDef),
                        cellCustomClasses({ padding })
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          {/* mt-[5px] to be aligned  */}
                          <span
                            className={cx('', hasAtLeastOneColumnSorting ? 'mt-[5px]' : '')}
                            style={{
                              wordBreak: 'break-word', // does not exist in tailwind
                            }}
                          >
                            {flexRender(columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            /* eslint-disable-next-line jsx-a11y/role-supports-aria-props */
                            <button
                              type="button"
                              className="fr-btn--sort fr-btn fr-btn--sm relative"
                              aria-sort={
                                (
                                  {
                                    asc: 'ascending',
                                    desc: 'descending',
                                  } as const
                                )[header.column.getIsSorted() as string] ?? undefined
                              }
                              onClick={header.column.getToggleSortingHandler()}
                              title="Cliquer pour trier"
                            >
                              Trier
                              {header.column.getIsSorted() && table.getState().sorting.length > 1 && (
                                <span className="absolute bottom-[2px] right-1 text-xs">
                                  {table.getState().sorting.findIndex((sort) => sort.id === header.column.id) + 1}
                                </span>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: 'grid',
              height: `${(loading ? 5 : filteredRows.length) * maxRowHeight}px`, // tells scrollbar how big the table is
              position: 'relative', // needed for absolute positioning of rows
            }}
          >
            {loading &&
              [1, 2, 3, 4, 5].map((value, index) => (
                <tr
                  key={`loading_${value}`}
                  className="grid absolute w-full"
                  style={{ gridTemplateColumns, transform: `translateY(${index * 50}px)` }}
                >
                  {columns.map((column, index) => (
                    <td key={`loading_${value}_${index}`} className={cx('!flex items-center', columnClassName(column))}>
                      <div role="status" className="animate-pulse text-center w-[90%]">
                        <div className="mx-auto my-2 h-3.5 rounded-full bg-gray-200"></div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    data-index={virtualRow.index} // needed for dynamic row height measurement
                    ref={(node) => rowVirtualizer.measureElement(node)} // measure dynamic row height
                    key={row.id}
                    className="grid absolute w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`, // this should always be a `style` as it changes on scroll
                      gridTemplateColumns,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnDef = cell.column.columnDef as ColumnDef<T>;
                      const CellTag = columnDef.id === 'selection' ? 'th' : 'td';

                      return (
                        <CellTag
                          key={cell.id}
                          className={cx(
                            '!flex items-center',
                            {
                              'overflow-auto': !React.isValidElement(cell.getValue()), // this is a hack as for DebugDrawer, overflow was causing problems
                              'fr-cell--fixed': columnDef.id === 'selection',
                            },
                            columnClassName(columnDef),
                            cellCustomClasses({ padding })
                          )}
                          scope={columnDef.id === 'selection' ? 'row' : undefined}
                        >
                          {cellRender(cell)}
                        </CellTag>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TableSimple;
