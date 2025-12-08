import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { type RefObject, useEffect } from 'react';

export function useTableVirtualization<T>({
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
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 20, // The number of items to render above and below the visible area
  });

  // Sync virtualizer to external ref if provided
  useEffect(() => {
    if (virtualizerRef) {
      virtualizerRef.current = rowVirtualizer;
    }
  }, [rowVirtualizer, virtualizerRef]);

  return rowVirtualizer;
}
