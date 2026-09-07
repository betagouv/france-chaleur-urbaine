import { useState } from 'react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import cx from '@/utils/cx';

import type { DataTableInstance } from '../useDataTable';
import { FilterControl } from './FilterControl';
import type { FilterValues } from './filter-types';

type FiltersDialogProps<Row> = {
  table: DataTableInstance<Row>;
};

/**
 * « Filtres » button opening a dialog that lists every filter of the table with its control.
 */
export function FiltersDialog<Row>({ table }: FiltersDialogProps<Row>) {
  const [isOpen, setIsOpen] = useState(false);
  const filterValues = table.filterValues as FilterValues;
  const count = table.activeFiltersCount;

  return (
    <Dialog
      title="Filtres"
      size="lg"
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button
          size="small"
          priority={count > 0 ? 'secondary' : 'tertiary'}
          iconId="ri-filter-2-line"
          className={cx(count > 0 && 'animate-[puff_0.2s_ease-in-out]')}
        >
          {count > 0 ? `Filtres (${count})` : 'Filtres'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {table.filters.map((filter) => {
          const isActive = filterValues[filter.id] !== undefined;
          return (
            <section key={filter.id} className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold leading-tight mb-0">{filter.label}</p>
                  {filter.description && <div className="text-sm text-gray-600">{filter.description}</div>}
                </div>
                {isActive && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge size="sm" type="actif" noIcon />
                    <Button
                      priority="tertiary no outline"
                      iconId="ri-close-line"
                      size="small"
                      onClick={() => table.setFilterValue(filter.id, undefined)}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </div>
              <FilterControl
                filter={filter}
                value={filterValues[filter.id]}
                onChange={(value) => table.setFilterValue(filter.id, value)}
                facetOptions={table.facetOptions[filter.id]}
                rangeDomain={table.rangeDomains[filter.id]}
              />
            </section>
          );
        })}
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button priority="tertiary" iconId="ri-refresh-line" size="small" onClick={table.resetFilters}>
            Réinitialiser tout
          </Button>
          <Button priority="primary" size="small" iconId="ri-check-line" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
