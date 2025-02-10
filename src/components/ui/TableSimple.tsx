import { fr } from '@codegouvfr/react-dsfr';
import Input from '@codegouvfr/react-dsfr/Input';
import {
  type Cell,
  type ColumnDef as ColumnDefOriginal,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';

import { isDevModeEnabled } from '@/hooks/useDevMode';
import cx from '@/utils/cx';

import TableCell, { type TableCellProps } from './TableCell';

export type ColumnDef<T, K = any> = ColumnDefOriginal<T, K> & {
  cellType?: TableCellProps<T>['type'];
  align?: 'center' | 'left' | 'right';
  flex?: number;
  className?: string;
  suffix?: React.ReactNode;
};

export type TableSimpleProps<Data = any> = {
  data: Data[];
  columns: ColumnDef<Data>[];
  initialSortingState?: SortingState;
  loading?: boolean;
};

const TableSimple = <T extends RowData>({ data, columns, initialSortingState, loading }: TableSimpleProps<T>) => {
  const [globalFilter, setGlobalFilter] = React.useState<any>([]);
  const [sortingState, setSortingState] = React.useState<SortingState>(initialSortingState ?? []);

  const columnClassName = ({ align, className }: ColumnDef<T>) => {
    const classNames = [];

    if (align === 'left') classNames.push('text-left justify-start');
    if (align === 'right') classNames.push('text-right justify-end');
    if (align === 'center') classNames.push('text-center justify-center');

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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSortingState,
    debugTable: isDevModeEnabled(),
  });

  const { rows } = table.getRowModel();

  // the virtualizer needs to know the scrollable container element
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 64, // estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <>
      <Input
        label=""
        nativeInputProps={{
          value: globalFilter,
          onChange: (e) => table.setGlobalFilter(e.target.value),
          placeholder: 'Recherche...',
        }}
      />
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
          style={{
            display: 'grid',
            overflow: 'unset', // overwrite the dsfr
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
              <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
                {headerGroup.headers.map((header) => {
                  const columnDef = header.column.columnDef as ColumnDef<T>;
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        display: 'flex',
                        flex: columnDef.flex || 1,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: cx(columnClassName(columnDef), header.column.getCanSort() ? 'cursor-pointer select-none' : ''),
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(columnDef.header, header.getContext())}
                          {{
                            asc: ' ▲',
                            desc: ' ▼',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
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
              height: `${rowVirtualizer.getTotalSize() || 5 * 50}px`, // tells scrollbar how big the table is
              position: 'relative', // needed for absolute positioning of rows
            }}
          >
            {loading &&
              [1, 2, 3, 4, 5].map((value) => (
                <tr key={`loading_${value}`} className="flex">
                  {columns.map((column, index) => (
                    <td
                      key={`loading_${value}_${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: column.flex || 1,
                      }}
                      className={columnClassName(column)}
                    >
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
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`, // this should always be a `style` as it changes on scroll
                      width: '100%',
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnDef = cell.column.columnDef as ColumnDef<T>;
                      return (
                        <td
                          key={cell.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: columnDef.flex || 1,
                          }}
                          className={columnClassName(columnDef)}
                        >
                          {cellRender(cell)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TableSimple;
