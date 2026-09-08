import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { ROW_HEIGHTS } from './constants';
import { DataTableRow } from './DataTableRow';
import type { RowHeight } from './types';
import type { DataTableInstance } from './useDataTable';

type DataTableBodyProps<Row> = {
  table: DataTableInstance<Row>;
  rowHeight: RowHeight;
  virtualized: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  selectedRowId: string | null | undefined;
  onRowClick?: (row: Row) => void;
  onRowDoubleClick?: (row: Row) => void;
};

/**
 * Rows of the table, all of them or a virtualized window padded by two spacer rows (same DOM, same
 * fixed row height in both modes). Registers `scrollToRow` on the instance.
 */
export function DataTableBody<Row>({
  table,
  rowHeight,
  virtualized,
  scrollContainerRef,
  selectedRowId,
  onRowClick,
  onRowDoubleClick,
}: DataTableBodyProps<Row>) {
  const tanstackRows = table.table.getRowModel().rows;
  const heightPx = ROW_HEIGHTS[rowHeight];
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const virtualizer = useVirtualizer({
    count: tanstackRows.length,
    enabled: virtualized,
    estimateSize: () => heightPx,
    getScrollElement: () => scrollContainerRef.current,
    overscan: 10,
  });

  // Exposes scroll-to-row to the page (map ↔ table links) in both render modes.
  useEffect(() => {
    table.scrollToRowRef.current = (rowId) => {
      const index = tanstackRows.findIndex((row) => row.id === rowId);
      if (index < 0) {
        return;
      }
      if (virtualized) {
        virtualizer.scrollToIndex(index, { align: 'center' });
      } else {
        bodyRef.current?.querySelector(`[data-row-id="${CSS.escape(rowId)}"]`)?.scrollIntoView({ block: 'center' });
      }
    };
    return () => {
      table.scrollToRowRef.current = null;
    };
  }, [table.scrollToRowRef, tanstackRows, virtualized, virtualizer]);

  const toggleSelected = useCallback((rowId: string) => table.table.getRow(rowId).toggleSelected(), [table.table]);

  const virtualItems = virtualized ? virtualizer.getVirtualItems() : null;
  const renderedIndexes = virtualItems ? virtualItems.map((virtualItem) => virtualItem.index) : tanstackRows.map((_, index) => index);
  const paddingTop = virtualItems && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems && virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <tbody ref={bodyRef}>
      {paddingTop > 0 && <tr style={{ height: paddingTop }} aria-hidden />}
      {renderedIndexes.map((index) => {
        const row = tanstackRows[index];
        return (
          <DataTableRow
            key={row.id}
            item={row.original}
            rowId={row.id}
            columns={table.columns}
            rowHeight={rowHeight}
            isEven={index % 2 === 0}
            isHighlighted={selectedRowId !== undefined && selectedRowId !== null && selectedRowId === row.id}
            isSelected={row.getIsSelected()}
            selectable={table.enableRowSelection}
            onToggleSelected={toggleSelected}
            onClick={onRowClick}
            onDoubleClick={onRowDoubleClick}
          />
        );
      })}
      {paddingBottom > 0 && <tr style={{ height: paddingBottom }} aria-hidden />}
    </tbody>
  );
}
