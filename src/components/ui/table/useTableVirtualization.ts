import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { type RefObject, useCallback, useEffect } from 'react';

export function useTableVirtualization<T extends { id: string }>({
  rows,
  tableContainerRef,
  rowHeight,
  virtualizerRef,
}: {
  rows: T[];
  tableContainerRef: RefObject<HTMLDivElement | null>;
  rowHeight: number;
  virtualizerRef?: RefObject<Virtualizer<HTMLDivElement, Element> | null>;
}) {
  // Measured heights are cached by this key. Keyed by row identity, not by position: after a filter or
  // a sort, a row that moves to another index keeps its own height. With the default (index) key, a
  // row reused by React at a new index without changing size triggers no ResizeObserver event and
  // inherits the stale height of whatever row was there before (rows then overlap / get clipped).
  const getItemKey = useCallback((index: number) => rows[index].id, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    getItemKey,
    getScrollElement: () => tableContainerRef.current,
    // Unrounded height (TanStack's default rounds the ResizeObserver size): rows are CSS grid, not
    // table rows, so the historical Firefox border-measurement issue does not apply.
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 8, // The number of items to render above and below the visible area
  });

  // Sync virtualizer to external ref if provided
  useEffect(() => {
    if (virtualizerRef) {
      virtualizerRef.current = rowVirtualizer;
    }
  }, [rowVirtualizer, virtualizerRef]);

  return rowVirtualizer;
}
