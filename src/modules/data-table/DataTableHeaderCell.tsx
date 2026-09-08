import type { Column } from '@tanstack/react-table';

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
 * Header cell; a sortable column is a button (shift+click adds a multi-sort criterion, the badge shows its rank).
 * The sort icon stays small and inline so wide headers do not overflow their column.
 */
export function DataTableHeaderCell<Row>({ column, tanstackColumn, sortingCount }: DataTableHeaderCellProps<Row>) {
  const canSort = column.sortable && tanstackColumn !== undefined;
  const sorted = canSort ? tanstackColumn.getIsSorted() : false;
  const sortIndex = canSort && sorted && sortingCount > 1 ? tanstackColumn.getSortIndex() + 1 : null;
  const label = <span className="leading-tight wrap-break-word">{column.header}</span>;

  return (
    <th
      scope="col"
      className={cx(
        'px-2 py-2 align-middle whitespace-normal text-sm font-semibold overflow-hidden',
        alignClasses[column.align],
        column.className
      )}
      aria-sort={canSort ? (sorted ? ariaSortValues[sorted] : 'none') : undefined}
    >
      {canSort ? (
        <button
          type="button"
          className={cx(
            'group flex items-center gap-1 w-full bg-transparent border-0 p-0 text-inherit font-inherit cursor-pointer',
            alignClasses[column.align]
          )}
          title="Trier (Maj + clic pour un tri combiné)"
          onClick={tanstackColumn.getToggleSortingHandler()}
        >
          {label}
          <span
            aria-hidden
            className={cx(
              'shrink-0 fr-icon--sm leading-none',
              sorted === 'asc' ? 'fr-icon-arrow-up-line' : sorted === 'desc' ? 'fr-icon-arrow-down-line' : 'fr-icon-arrow-up-down-line',
              !sorted && 'opacity-40 group-hover:opacity-100'
            )}
          />
          {sortIndex !== null && <span className="text-xs text-(--text-mention-grey)">{sortIndex}</span>}
        </button>
      ) : (
        label
      )}
    </th>
  );
}
