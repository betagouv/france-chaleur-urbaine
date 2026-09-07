import type React from 'react';
import { memo } from 'react';

import cx from '@/utils/cx';

import { renderDefaultCell } from './cells';
import { ROW_HEIGHTS, ROW_LINE_CLAMP } from './constants';
import type { ResolvedColumn, RowHeight } from './types';

type DataTableRowProps<Row> = {
  item: Row;
  rowId: string;
  columns: ResolvedColumn<Row>[];
  rowHeight: RowHeight;
  isEven: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  selectable: boolean;
  onToggleSelected?: (rowId: string) => void;
  onClick?: (row: Row) => void;
  onDoubleClick?: (row: Row) => void;
};

const alignClasses = { center: 'text-center! justify-center', left: 'text-left! justify-start', right: 'text-right! justify-end' } as const;

const isInteractiveTarget = (event: React.MouseEvent): boolean =>
  (event.target as HTMLElement).closest('button, a, input, select, textarea, label') !== null;

/**
 * One table row at a fixed height. Memoized: re-renders only when its item, columns or flags change,
 * so scrolling, searching and selecting other rows leave it untouched.
 */
function DataTableRowInner<Row>({
  item,
  rowId,
  columns,
  rowHeight,
  isEven,
  isHighlighted,
  isSelected,
  selectable,
  onToggleSelected,
  onClick,
  onDoubleClick,
}: DataTableRowProps<Row>) {
  const heightPx = ROW_HEIGHTS[rowHeight];
  const isClickable = onClick !== undefined || onDoubleClick !== undefined;
  const handleClick = onClick && ((event: React.MouseEvent) => !isInteractiveTarget(event) && onClick(item));
  const handleDoubleClick = onDoubleClick && ((event: React.MouseEvent) => !isInteractiveTarget(event) && onDoubleClick(item));

  return (
    <tr
      data-row-id={rowId}
      className={cx(
        isClickable && 'cursor-pointer',
        isHighlighted || isSelected
          ? 'bg-[#e1f1f5]! hover:bg-[#d2eaf1]!'
          : isEven
            ? 'bg-white! hover:bg-gray-100!'
            : 'bg-stripe! hover:bg-gray-100!'
      )}
      style={{ height: heightPx }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {selectable && (
        <td className="px-2 py-0 align-middle text-center!">
          <input
            type="checkbox"
            className="size-4 cursor-pointer"
            checked={isSelected}
            aria-label="Sélectionner la ligne"
            onChange={() => onToggleSelected?.(rowId)}
          />
        </td>
      )}
      {columns.map((column) => {
        const value = column.accessor(item);
        const content = column.cell ? column.cell({ row: item, value }) : renderDefaultCell(value);
        const isText = typeof content === 'string' || typeof content === 'number';
        return (
          <td key={column.id} className={cx('px-2 py-1 align-middle overflow-hidden', alignClasses[column.align], column.className)}>
            <div
              className={cx('overflow-hidden', isText && ROW_LINE_CLAMP[rowHeight])}
              style={{ maxHeight: heightPx - 8 }}
              title={isText ? String(content) : undefined}
            >
              {content}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

export const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;
