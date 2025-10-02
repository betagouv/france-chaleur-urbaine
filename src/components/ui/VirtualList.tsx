import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';

export type VirtualListRowProps<T> = { item: T };

type VirtualListProps<T> = {
  items: readonly T[];
  renderRow: React.ComponentType<VirtualListRowProps<T>>;
  estimateSize?: number;
  height?: number | string;
  getItemKey?: (item: T) => React.Key;
};

function VirtualList<T>({ items, renderRow: RenderRow, estimateSize = 35, height = 800, getItemKey }: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    getScrollElement: () => parentRef.current,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        contain: 'strict',
        height,
        overflowY: 'auto',
        width: '100%',
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
            width: '100%',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const index = virtualItem.index;
            const item = items[index];
            const key = getItemKey ? getItemKey(item) : virtualItem.key;
            return (
              <div key={key} data-index={index} ref={virtualizer.measureElement}>
                <RenderRow item={item} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
