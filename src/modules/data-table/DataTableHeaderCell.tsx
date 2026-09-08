import type { Column } from '@tanstack/react-table';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';

import type { ResolvedColumn } from './types';

type DataTableHeaderCellProps<Row> = {
  column: ResolvedColumn<Row>;
  tanstackColumn: Column<Row, unknown> | undefined;
  sortingCount: number;
};

const alignClasses = { center: 'text-center! justify-center', left: 'text-left! justify-start', right: 'text-right! justify-end' } as const;

const ariaSortValues = { asc: 'ascending', desc: 'descending' } as const;

/**
 * Header cell with an optional sort button (shift+click adds a multi-sort criterion; the badge shows its rank).
 */
export function DataTableHeaderCell<Row>({ column, tanstackColumn, sortingCount }: DataTableHeaderCellProps<Row>) {
  const canSort = column.sortable && tanstackColumn !== undefined;
  const sorted = canSort ? tanstackColumn.getIsSorted() : false;
  const sortIndex = canSort && sorted && sortingCount > 1 ? tanstackColumn.getSortIndex() + 1 : null;

  return (
    <th
      scope="col"
      className={cx('px-2 py-2 align-middle whitespace-normal', alignClasses[column.align], column.className)}
      aria-sort={canSort ? (sorted ? ariaSortValues[sorted] : 'none') : undefined}
    >
      <div className={cx('flex items-center gap-1', alignClasses[column.align])}>
        <span className="leading-tight wrap-break-word">{column.header}</span>
        {canSort && (
          <Button
            size="small"
            priority={sorted ? 'secondary' : 'tertiary no outline'}
            className="relative shrink-0"
            iconId={sorted === 'asc' ? 'fr-icon-sort-asc' : sorted === 'desc' ? 'fr-icon-sort-desc' : 'fr-icon-arrow-up-down-fill'}
            title="Trier (Maj + clic pour un tri combiné)"
            onClick={tanstackColumn.getToggleSortingHandler()}
          >
            <span className="fr-sr-only">Trier</span>
            {sortIndex !== null && <span className="absolute bottom-0 right-1 text-xs">{sortIndex}</span>}
          </Button>
        )}
      </div>
    </th>
  );
}
