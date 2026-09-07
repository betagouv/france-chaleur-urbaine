import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ROW_HEIGHTS } from './constants';
import { DataTableRow } from './DataTableRow';
import type { RowHeight } from './types';
import type { DataTableInstance } from './useDataTable';

type DataTableBodyProps<Row> = {
  table: DataTableInstance<Row>;
  rowHeight: RowHeight;
  virtualized: boolean;
  /** Bounded container scrolling; `null` when the page (window) scrolls. */
  scrollContainerRef: RefObject<HTMLDivElement | null> | null;
  selectedRowId: string | null | undefined;
  onRowClick?: (row: Row) => void;
  onRowDoubleClick?: (row: Row) => void;
};

/**
 * Rows of the table, all of them or a virtualized window padded by two spacer rows (same DOM, same
 * fixed row height in both modes). Virtualization follows the page scroll unless the table has its own
 * bounded scroll container. Registers `scrollToRow` on the instance.
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
  const usesWindow = scrollContainerRef === null;

  // Offset of the body from the document top, so the window virtualizer knows where the rows start.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (usesWindow && virtualized && bodyRef.current) {
      setScrollMargin(bodyRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, [usesWindow, virtualized, tanstackRows.length]);

  const containerVirtualizer = useVirtualizer({
    count: tanstackRows.length,
    enabled: virtualized && !usesWindow,
    estimateSize: () => heightPx,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    overscan: 10,
  });
  const windowVirtualizer = useWindowVirtualizer({
    count: tanstackRows.length,
    enabled: virtualized && usesWindow,
    estimateSize: () => heightPx,
    overscan: 10,
    scrollMargin,
  });
  const virtualizer = usesWindow ? windowVirtualizer : containerVirtualizer;

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
  // Window virtualizer positions are document-relative: subtract the body offset to get the padding.
  const startOffset = usesWindow ? scrollMargin : 0;
  const paddingTop = virtualItems && virtualItems.length > 0 ? virtualItems[0].start - startOffset : 0;
  const paddingBottom =
    virtualItems && virtualItems.length > 0 ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1].end - startOffset) : 0;

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
