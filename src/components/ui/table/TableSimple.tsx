import { fr } from '@codegouvfr/react-dsfr';
import Input from '@codegouvfr/react-dsfr/Input';
import { usePrevious } from '@react-hookz/web';
import {
  type AccessorKeyColumnDefBase,
  type ColumnDef as ColumnDefOriginal,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getMemoOptions,
  getSortedRowModel,
  type Header,
  memo,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingFn,
  type SortingState,
  type Table,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { cva } from 'class-variance-authority';
import dynamic from 'next/dynamic';
import React, { type RefObject, useCallback, useEffect } from 'react';

import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useTableState } from '@/components/ui/table/useTableState';
import { isDevModeEnabled } from '@/hooks/useDevMode';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import type { FlattenKeys } from '@/utils/typescript';
import TableCell, { type TableCellProps } from './TableCell';
import TableFilter, { defaultTableFilterFns, type TableFilterProps } from './TableFilter';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

export const customSortingFn = <T extends RowData>(): Record<string, SortingFn<T>> => ({
  // nullsLast will be working only when sorting is asc as react-table is just inversing the result of the function
  // when the actual sorting valueA - valueB should be replace by valueB - valueA
  nullsLast: (rowA: any, rowB: any, columnId: string) => {
    const valueA = rowA.getValue(columnId);
    const valueB = rowB.getValue(columnId);
    return valueA === null ? 1 : valueB === null ? -1 : valueA - valueB;
  },
});

export const customFilterFn = <T extends RowData>(): Record<string, FilterFn<T>> => ({
  equalsAny: (row, columnId, filterValue: Record<string, boolean>) => {
    const value = row.getValue<any>(columnId);
    return Object.entries(filterValue)
      .filter(([, isSelected]) => isSelected)
      .some(([key]) => value === key);
  },
  includesAny: (row, columnId, filterValue: Record<string, boolean>) => {
    let value = row.getValue<any>(columnId);
    if (value === true) value = 'true';
    if (value === false) value = 'false';

    if (!value) return false;

    return Object.entries(filterValue)
      .filter(([, isSelected]) => isSelected)
      .some(([key]) => value.includes(key));
  },
  inDateRangeNotNull: (row, columnId, filterValue: [string, string, boolean?]) => {
    const [minDate, maxDate, includeNull] = filterValue;
    const value = row.getValue<string | null>(columnId);

    if (value == null) {
      return includeNull === true;
    }

    return value >= minDate && value <= maxDate;
  },
  inNumberRangeNotNull: (row, columnId, filterValue: [number, number]) => {
    const [min, max] = filterValue;
    const value = row.getValue<number>(columnId);
    return value != null && value >= min && value <= max;
  },
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
  cellProps?: TableCellProps<T>['cellProps'];
  align?: 'center' | 'left' | 'right';
  className?: string;
  suffix?: React.ReactNode;
  sorting?: keyof ReturnType<typeof customSortingFn<T>>;
  filter?: keyof ReturnType<typeof customFilterFn<T>>;
  filterType?: TableFilterProps['type'];
  filterProps?: TableFilterProps['filterProps'];
  visible?: boolean;
} & ({ flex?: number } | { width?: 'auto' | string });

const cellCustomClasses = cva('', {
  defaultVariants: {
    padding: 'md',
  },
  variants: {
    padding: {
      lg: 'p-6!',
      md: '',
      sm: 'p-2! leading-tight!',
    },
  },
});

type TableRowProps<T> = {
  row: Row<T>;
  virtualRow: { index: number; start: number };
  gridTemplateColumns: string;
  rowIdKey: keyof T;
  rowSelection?: RowSelectionState;
  padding: 'sm' | 'md' | 'lg';
  onRowClick?: (rowId: any) => void;
  onRowDoubleClick?: (rowId: any) => void;
  measureElement?: (element: Element | null) => void;
  columnClassName: (columnDef: ColumnDef<T>) => string;
};

const TableRow = <T extends RowData>({
  row,
  virtualRow,
  gridTemplateColumns,
  rowIdKey,
  rowSelection,
  padding,
  onRowClick,
  onRowDoubleClick,
  measureElement,
  columnClassName,
}: TableRowProps<T>) => {
  const canSelectRow = onRowClick || onRowDoubleClick;
  const isSelected = rowSelection?.[(row.original as any)[rowIdKey]];
  return (
    <tr
      data-index={virtualRow.index}
      ref={measureElement}
      className={cx(
        'grid absolute w-full',
        canSelectRow && 'cursor-pointer transition-colors duration-100',
        !isSelected && 'hover:bg-gray-200!',
        isSelected ? 'bg-[#e1f1f5]! hover:bg-[#d2eaf1]!' : virtualRow.index % 2 === 0 ? 'bg-white!' : 'bg-stripe!'
      )}
      style={{
        gridTemplateColumns,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      onClick={
        onRowClick
          ? (event) => {
              const element = event.target as HTMLElement;
              // prevent row click when changing values in the table
              if (['INPUT', 'TEXTAREA', 'LABEL', 'SELECT'].includes(element.tagName)) {
                return;
              }
              onRowClick((row.original as any)[rowIdKey]);
            }
          : undefined
      }
      onDoubleClick={
        onRowDoubleClick
          ? (event) => {
              const element = event.target as HTMLElement;
              // prevent row click when changing values in the table
              if (['INPUT', 'TEXTAREA', 'LABEL', 'SELECT'].includes(element.tagName)) {
                return;
              }
              onRowDoubleClick((row.original as any)[rowIdKey]);
            }
          : undefined
      }
    >
      {row.getVisibleCells().map((cell) => {
        const { suffix, cellType, ...columnDef } = cell.column.columnDef as ColumnDef<T>;
        if (columnDef.visible === false) {
          return null;
        }
        const CellTag = columnDef.id === 'selection' ? 'th' : 'td';
        const value = cell.getValue();

        return (
          <CellTag
            key={
              // In case record has an id, use it in the key to avoid mismatching of cells
              // if rows change (as mainly index of the row is used in the key but no other identifier)
              `${cell.id}_${(cell.row.original as any).id ?? ''}`
            }
            className={cx(
              'flex! items-center',
              {
                'fr-cell--fixed': columnDef.id === 'selection',
                'overflow-auto': !React.isValidElement(cell.getValue()),
              },
              columnClassName(columnDef),
              cellCustomClasses({ padding })
            )}
            scope={columnDef.id === 'selection' ? 'row' : undefined}
          >
            <TableCell type={cellType} value={value} data={cell.row.original} cellProps={columnDef.cellProps}>
              {flexRender(columnDef.cell, cell.getContext())}
            </TableCell>
            {value ? suffix : ''}
          </CellTag>
        );
      })}
    </tr>
  );
};

type TableTHProps<T> = {
  header: Header<T, unknown>;
  columnDef: ColumnDef<T>;
  table: Table<T>;
  padding: 'sm' | 'md' | 'lg';
  controlsLayout: 'inline' | 'block';
  hasAtLeastOneColumnSorting: boolean;
  columnClassName: (columnDef: ColumnDef<T>) => string;
};

const TableTH = <T extends RowData>({
  header,
  columnDef,
  table,
  padding,
  controlsLayout,
  hasAtLeastOneColumnSorting,
  columnClassName,
}: TableTHProps<T>) => {
  const [loading, setLoading] = React.useState(false);
  const isSorted = header.column.getIsSorted();
  const isPreviousSorted = usePrevious(isSorted);

  React.useEffect(() => {
    if (isSorted !== isPreviousSorted && loading) {
      setLoading(false);
    }
  }, [isSorted, isPreviousSorted, loading]);

  if (columnDef.visible === false) {
    return null;
  }

  const canSort = header.column.getCanSort();
  const className = columnClassName(columnDef);
  const sorting = table.getState().sorting;
  const isInlineLayout = controlsLayout === 'inline';

  const onClickSort = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    header.column.getToggleSortingHandler()?.(e);
  };

  if (header.isPlaceholder) {
    return null;
  }

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      className={cx(
        'flex! flex-nowrap items-between overflow-auto gap-1',
        'hover:shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.05),5px_0_5px_-5px_rgba(0,0,0,0.05)]',
        isInlineLayout ? 'items-center' : 'items-between',
        columnClassName(columnDef),
        cellCustomClasses({ padding })
      )}
      aria-sort={
        canSort
          ? ((
              {
                asc: 'ascending',
                desc: 'descending',
              } as const
            )[isSorted as string] ?? 'none')
          : undefined
      }
    >
      <div className={cx('flex gap-1', isInlineLayout ? 'flex-row items-center' : 'flex-col')}>
        {/* mt-[5px] to be aligned  */}
        <span
          className={cx('leading-tight tracking-tighter', isInlineLayout ? '' : 'flex-1', hasAtLeastOneColumnSorting ? 'mt-[5px]' : '')}
          style={{
            wordBreak: 'break-word', // does not exist in tailwind
          }}
        >
          {flexRender(columnDef.header, header.getContext())}
        </span>
        <div className={cx('flex gap-1', isInlineLayout ? 'flex-1' : '', className)}>
          {canSort && (
            <Button
              size="small"
              priority={isSorted ? 'secondary' : 'tertiary'}
              className={cx(
                'w-8 relative [&:before]:mr-0 [&:before]:-ml-1', // for an unknown reason, the margin is not applied correctly in the button
                header.column.getIsSorted() && 'animate-[puff_0.2s_ease-in-out]'
              )}
              loading={loading}
              iconId={isSorted === 'asc' ? 'fr-icon-sort-asc' : isSorted === 'desc' ? 'fr-icon-sort-desc' : 'fr-icon-arrow-up-down-fill'}
              onClick={onClickSort}
              title="Cliquer pour trier"
            >
              <span className="fr-sr-only">Trier</span>
              {isSorted && sorting.length > 1 && (
                <span className="absolute bottom-[2px] right-1 text-xs">
                  {sorting.findIndex((sort) => sort.id === header.column.id) + 1}
                </span>
              )}
            </Button>
          )}
          {header.column.getCanFilter() && columnDef.filterType ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  priority={header.column.getIsFiltered() ? 'secondary' : 'tertiary'}
                  iconId={header.column.getIsFiltered() ? 'ri-filter-2-fill' : 'ri-filter-2-line'}
                  size="small"
                  className={cx('min-w-8', header.column.getIsFiltered() && 'animate-[puff_0.2s_ease-in-out]')}
                />
              </PopoverTrigger>
              <PopoverContent className="px-5 pb-2 py-8 w-[300px]" side="top">
                <TableFilter
                  type={columnDef.filterType as any /* Not working as is for an unknown reason*/}
                  value={header.column.getFilterValue() as any /* Not working as is for an unknown reason*/}
                  onChange={header.column.setFilterValue}
                  filterProps={columnDef.filterProps as any /* Not working as is for an unknown reason*/}
                  facetedMinMaxValues={header.column.getFacetedMinMaxValues()}
                  facetedUniqueValues={header.column.getFacetedUniqueValues()}
                  cellType={columnDef.cellType}
                />
                <Button
                  priority="tertiary"
                  iconId="ri-close-line"
                  size="small"
                  className={cx(header.column.getIsFiltered() ? 'visible' : 'invisible')}
                  onClick={() => {
                    header.column.setFilterValue(undefined);
                    // Close the popover programmatically
                    const popoverElement = document.querySelector('[data-radix-popper-content-wrapper]');
                    if (popoverElement) {
                      const popoverTrigger = popoverElement.previousElementSibling as HTMLElement;
                      popoverTrigger?.click?.();
                    }
                  }}
                >
                  Réinitialiser
                </Button>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </div>
    </th>
  );
};

export type TableSimpleProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  initialSortingState?: SortingState;
  columnFilters?: ColumnFiltersState;
  loading?: boolean;
  caption?: string;
  enableRowSelection?: boolean;
  enableGlobalFilter?: boolean;
  globalFilter?: string;
  className?: string;
  wrapperClassName?: string;
  fluid?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  rowSelection?: RowSelectionState;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowClick?: (rowId: any) => void;
  onRowDoubleClick?: (rowId: any) => void;
  rowIdKey?: keyof T;
  rowHeight?: number;
  controlsLayout?: 'inline' | 'block';
  onFilterChange?: (filteredRows: T[]) => void;
  nbLoadingItems?: number;
  loadingEmptyMessage?: string;
  height?: string;
  virtualizerRef?: RefObject<Virtualizer<HTMLDivElement, Element>>;
  topRightActions?: React.ReactNode;
  export?: {
    fileName: string;
    sheetName: string;
  };
  /**
   * Synchronise l'état du tableau avec l'URL avec cette clé comme préfixe.
   */
  urlSyncKey?: string;
};

const TableSimple = <T extends RowData>({
  data,
  columns,
  initialSortingState,
  columnFilters: defaultColumnFilters,
  loading,
  caption,
  enableRowSelection,
  enableGlobalFilter = false,
  globalFilter: externalGlobalFilter,
  rowSelection,
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  rowIdKey = 'id' as any,
  onFilterChange,
  className: tableClassName,
  wrapperClassName,
  fluid,
  padding = 'md',
  rowHeight = 64,
  controlsLayout = 'inline',
  nbLoadingItems = 5,
  loadingEmptyMessage = 'Aucun résultat',
  height = '600px',
  virtualizerRef,
  topRightActions,
  export: exportConfig,
  urlSyncKey,
}: TableSimpleProps<T>) => {
  const {
    columnFilters,
    globalFilter,
    setColumnFilters,
    setGlobalFilter,
    setSorting,
    sorting: sortingState,
  } = useTableState(urlSyncKey, initialSortingState, defaultColumnFilters, externalGlobalFilter);

  const columnClassName = React.useCallback(({ align, className }: ColumnDef<T>) => {
    const classNames = [];

    if (align === 'left') classNames.push('text-left! justify-start'); // need the ! to bypass DSFR
    if (align === 'right') classNames.push('text-right! justify-end');
    if (align === 'center') classNames.push('text-center! justify-center');

    if (className) classNames.push(className);

    return classNames.join(' ');
  }, []);

  const selectionColumn: ColumnDef<T> = {
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
    id: 'selection',
  };

  const tableColumns = React.useMemo(() => {
    return enableRowSelection ? [selectionColumn, ...columns] : columns;
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
    const filterTypeName = defaultTableFilterFns[column.filterType as keyof typeof defaultTableFilterFns];
    if (!column.filter && !column.filterFn && column.filterType && filterTypeName) {
      // Si c'est un Range avec DateTime/Date, utilise inDateRangeNotNull
      const isDateRange = column.filterType === 'Range' && (column.cellType === 'DateTime' || column.cellType === 'Date');
      const actualFilterFn = isDateRange ? 'inDateRangeNotNull' : filterTypeName;
      column.filterFn = customFilterFns[actualFilterFn] || actualFilterFn;
    }
  });

  const columnVisibility = React.useMemo(() => {
    return tableColumns.reduce(
      (acc, column) => {
        acc[column.id ?? (column as any).accessorKey ?? column.header] = column.visible ?? true;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }, [tableColumns]);

  // Détermine le filtre global effectif : priorité à externalGlobalFilter si fourni et urlSync désactivé
  const effectiveGlobalFilter = urlSyncKey ? globalFilter : (externalGlobalFilter ?? globalFilter);
  // Active la gestion du changement de filtre global uniquement si urlSync est activé ou si externalGlobalFilter n'est pas fourni
  const shouldHandleGlobalFilterChange = urlSyncKey || !isDefined(externalGlobalFilter);

  const table = useReactTable({
    columns: tableColumns,
    data,
    debugTable: isDevModeEnabled(),
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFacetedMinMaxValues: getFCUFacetedMinMaxValues() as any, //if you need min/max values. any to handle [string, string]
    getFacetedRowModel: getFacetedRowModel(), //if you need a list of values for a column (other faceted row models depend on this one)
    getFacetedUniqueValues: getFacetedUniqueValues(), //if you need a list of unique values
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: shouldHandleGlobalFilterChange ? setGlobalFilter : undefined,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter: effectiveGlobalFilter,
      rowSelection,
      sorting: sortingState,
    },
  });

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  const { rows } = table.getRowModel();
  const { rows: filteredRows } = table.getFilteredRowModel();

  const hasAtLeastOneColumnSorting = table.getHeaderGroups()[0].headers.some((header) => header.column.getCanSort());

  React.useEffect(() => {
    if (onFilterChange && rows.length > 0) {
      onFilterChange(filteredRows.map((row) => row.original));
    }
  }, [rows, filteredRows, onFilterChange]);

  const buildExportData = useCallback(() => {
    if (!exportConfig) {
      return [];
    }
    const computedExportColumns = tableColumns
      .filter((col) => col.visible !== false && col.id !== 'selection' && col.id !== 'actions')
      .map((col) => {
        const header = (
          typeof col.header === 'string' ? col.header : (col as AccessorKeyColumnDefBase<T, any>).accessorKey || col.id || ''
        ) as string;

        return 'accessorKey' in col
          ? {
              accessorKey: col.accessorKey as keyof T,
              name: header,
            }
          : 'accessorFn' in col
            ? {
                accessorFn: col.accessorFn as (item: T) => string | number | boolean,
                name: header,
              }
            : null;
      })
      .filter((col) => col !== null);

    const filteredData = filteredRows.map((row) => row.original);

    return [
      {
        columns: computedExportColumns,
        data: filteredData,
        name: exportConfig.sheetName,
      },
    ];
  }, [tableColumns, filteredRows, exportConfig]);

  // the virtualizer needs to know the scrollable container element
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight, // estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 20, // The number of items to render above and below the visible area
  });

  useEffect(() => {
    if (virtualizerRef) {
      virtualizerRef.current = rowVirtualizer;
    }
  }, [rowVirtualizer, virtualizerRef]);

  const gridTemplateColumns = table
    .getHeaderGroups()[0]
    .headers.map((header, index) => {
      const columnDef = header.column.columnDef as ColumnDef<T>;
      if (columnDef.visible === false) {
        return null;
      }
      const sizeValue = (columnDef as any)?.width ?? `${(columnDef as any)?.flex ?? 1}fr`; // TOFIX: remove any but could not find a way to do it
      return enableRowSelection && index === 0 ? 'auto' : sizeValue;
    })
    .join(' ');

  const bodyHeight = loading ? nbLoadingItems * rowHeight : rowVirtualizer.getTotalSize() || 1 * rowHeight;

  return (
    <section className={wrapperClassName}>
      <div className="flex items-center space-x-6">
        {enableGlobalFilter && (
          <Input
            label=""
            className="flex-1 mb-2"
            nativeInputProps={{
              onChange: (e) => table.setGlobalFilter(e.target.value),
              placeholder: 'Recherche...',
              value: globalFilter,
            }}
          />
        )}
        {(exportConfig || topRightActions) && (
          <div className="flex items-center gap-2">
            {exportConfig && (
              <ButtonExport
                size="small"
                filename={exportConfig.fileName}
                sheets={buildExportData}
                iconId="ri-download-line"
                priority="secondary"
              >
                Télécharger les données
              </ButtonExport>
            )}
            {topRightActions}
          </div>
        )}
      </div>
      {caption && <div className="text-2xl leading-8 font-bold mb-5">{caption}</div>}
      <div
        className={cx(fr.cx('fr-table', 'fr-table--no-scroll'), 'scrollbar-visible my-0!')}
        ref={tableContainerRef}
        style={{
          maxHeight: height, // should be a fixed height
          overflow: 'auto', // our scrollable table container
          position: 'relative', // needed for sticky header
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table
          className={cx(fluid ? 'w-max!' : '', tableClassName)}
          style={{
            display: 'grid',
            marginTop: '1px', // make top border visible as overflow hides it
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
              <tr key={headerGroup.id} style={{ gridTemplateColumns }} className="grid w-full">
                {headerGroup.headers.map((header) => {
                  const columnDef = header.column.columnDef as ColumnDef<T>;

                  return (
                    <TableTH
                      key={header.id}
                      header={header}
                      columnDef={columnDef}
                      table={table}
                      padding={padding}
                      controlsLayout={controlsLayout}
                      hasAtLeastOneColumnSorting={hasAtLeastOneColumnSorting}
                      columnClassName={columnClassName}
                    />
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: 'grid',
              height: `${bodyHeight}px`, // tells scrollbar how big the table is
              position: 'relative', // needed for absolute positioning of rows
            }}
          >
            {loading &&
              Array.from({ length: nbLoadingItems }, (_, i) => i).map((value) => (
                <tr
                  key={`loading_${value}`}
                  className="grid absolute w-full"
                  style={{ gridTemplateColumns, height: rowHeight, transform: `translateY(${value * rowHeight}px)` }}
                >
                  {columns.map((column, index) => (
                    <td key={`loading_${value}_${index}`} className={cx('flex! items-center', columnClassName(column))}>
                      <div role="status" className="animate-pulse text-center w-[90%]">
                        <div className="mx-auto my-2 h-3.5 rounded-full bg-gray-200" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              (rowVirtualizer.getVirtualItems().length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="!flex justify-start items-center h-full text-black ">
                    {data.length === 0 ? loadingEmptyMessage : 'Aucun résultat trouvé, élargissez votre recherche'}
                  </td>
                </tr>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      row={row}
                      virtualRow={virtualRow}
                      gridTemplateColumns={gridTemplateColumns}
                      rowIdKey={rowIdKey}
                      rowSelection={rowSelection}
                      padding={padding}
                      onRowClick={onRowClick}
                      onRowDoubleClick={onRowDoubleClick}
                      measureElement={(node) => rowVirtualizer.measureElement(node)}
                      columnClassName={columnClassName}
                    />
                  );
                })
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TableSimple;

type DotToUnderscore<T extends string> = T extends `${infer A}.${infer B}` ? `${A}_${DotToUnderscore<B>}` : T;

export type QuickFilterPreset<Data> = {
  label: React.ReactNode;
  valueSuffix?: React.ReactNode;
  getStat?: (data: Data[]) => number;
  filters: {
    id: DotToUnderscore<FlattenKeys<Data>>;
    value: boolean | number | [number, number] | Record<string, boolean | undefined>;
  }[];
};

// adapted from https://github.com/TanStack/table/blob/02c203afed5865cfec0aa614de9f2861645d6ff9/packages/table-core/src/utils/getFacetedMinMaxValues.ts
// to handle string dates
function getFCUFacetedMinMaxValues<TData extends RowData>() {
  return (table: Table<TData>, columnId: string) =>
    memo(
      () => [table.getColumn(columnId)?.getFacetedRowModel(), (table.getColumn(columnId)?.columnDef as any).cellType], // TODO cellType ne devrait pas se retrouver dans tanstack table
      (facetedRowModel, cellType) => {
        if (!facetedRowModel) return undefined;

        let uniqueValues = facetedRowModel.flatRows.flatMap((flatRow) => flatRow.getUniqueValues(columnId) ?? []) as string[] | number[];
        if (cellType !== 'DateTime' && cellType !== 'Date') {
          uniqueValues = uniqueValues.map(Number).filter((value) => !Number.isNaN(value)) as number[];
        }

        if (!uniqueValues.length) return;

        let facetedMinValue = uniqueValues[0]!;
        let facetedMaxValue = uniqueValues[uniqueValues.length - 1]!;

        for (const value of uniqueValues) {
          if (value < facetedMinValue) facetedMinValue = value;
          else if (value > facetedMaxValue) facetedMaxValue = value;
        }

        return [facetedMinValue, facetedMaxValue] as [number, number] | [string, string];
      },
      getMemoOptions(table.options, 'debugTable', 'getFacetedMinMaxValues')
    );
}
