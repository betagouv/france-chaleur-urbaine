import { fr } from '@codegouvfr/react-dsfr';
import Input from '@codegouvfr/react-dsfr/Input';
import {
  type CellContext,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';

import { isDevModeEnabled } from '@/hooks/useDevMode';

export type SimpleTableProps<Data = any> = {
  data: Data[];
  columns: ColumnDef<Data, any>[];
  initialSortingState?: SortingState;
};

const SimpleTable = ({ data, columns, initialSortingState }: SimpleTableProps) => {
  const [globalFilter, setGlobalFilter] = React.useState<any>([]);
  const [sortingState, setSortingState] = React.useState<SortingState>(initialSortingState ?? []);

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
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        display: 'flex',
                        width: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
              height: `${rowVirtualizer.getTotalSize()}px`, // tells scrollbar how big the table is
              position: 'relative', // needed for absolute positioning of rows
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
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
                    return (
                      <td
                        key={cell.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

export default SimpleTable;

export const tableCellFormatter = (info: CellContext<any, any>) => {
  if (!info.getValue()) {
    return '';
  }
  const date = new Date(info.getValue<string>());
  return <div title={date.toLocaleString()}>{date.toLocaleDateString()}</div>;
};

export const tableBooleanFormatter = (info: CellContext<any, any>) => (info.getValue() ? 'Oui' : 'Non');
