import { useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import cx from '@/utils/cx';

import type { DataTableInstance } from '../useDataTable';

type SortDialogProps<Row> = {
  table: DataTableInstance<Row>;
};

/**
 * « Trier » button opening a dialog listing the sortable columns; several criteria combine (rank badge).
 */
export function SortDialog<Row>({ table }: SortDialogProps<Row>) {
  const [isOpen, setIsOpen] = useState(false);
  const sortableColumns = table.columns.filter((column) => column.sortable);
  const sorting = table.sorting;

  return (
    <Dialog
      title="Trier"
      size="md"
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button size="small" priority={sorting.length > 0 ? 'secondary' : 'tertiary'} iconId="fr-icon-sort-desc">
          {sorting.length > 0 ? `Trier (${sorting.length})` : 'Trier'}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="fr-hint-text mb-1">Ajoutez plusieurs colonnes pour un tri combiné : le numéro indique l'ordre de priorité.</p>
        {sortableColumns.map((column) => {
          const tanstackColumn = table.table.getColumn(column.id);
          const sorted = tanstackColumn?.getIsSorted() ?? false;
          const priority = sorting.findIndex((entry) => entry.id === column.id);
          const applySort = (desc: boolean) =>
            (desc ? sorted === 'desc' : sorted === 'asc') ? tanstackColumn?.clearSorting() : tanstackColumn?.toggleSorting(desc, true);
          return (
            <section key={column.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2 px-3">
              <span className={cx('flex items-center gap-2 leading-tight', sorted && 'font-semibold')}>
                {priority >= 0 && (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-(--background-action-high-blue-france) text-xs text-white">
                    {priority + 1}
                  </span>
                )}
                {column.headerLabel}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="small"
                  priority={sorted === 'asc' ? 'primary' : 'tertiary'}
                  iconId="fr-icon-sort-asc"
                  title={`${column.headerLabel} croissant`}
                  onClick={() => applySort(false)}
                />
                <Button
                  size="small"
                  priority={sorted === 'desc' ? 'primary' : 'tertiary'}
                  iconId="fr-icon-sort-desc"
                  title={`${column.headerLabel} décroissant`}
                  onClick={() => applySort(true)}
                />
              </div>
            </section>
          );
        })}
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button priority="tertiary" iconId="ri-refresh-line" size="small" onClick={() => table.setSorting([])}>
            Réinitialiser
          </Button>
          <Button priority="primary" iconId="ri-check-line" size="small" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
