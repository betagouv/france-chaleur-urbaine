import Tag from '@codegouvfr/react-dsfr/Tag';

import { summarizeFilterValue } from '../filters/filter-summary';
import type { FilterValues } from '../filters/filter-types';
import type { DataTableInstance } from '../useDataTable';

type DataTableActiveStateProps<Row> = {
  table: DataTableInstance<Row>;
};

/**
 * Always-visible reminder of the active sort criteria and filters, each removable in one click.
 */
export function DataTableActiveState<Row>({ table }: DataTableActiveStateProps<Row>) {
  const filterValues = table.filterValues as FilterValues;
  const activeFilters = table.filters.filter((filter) => filterValues[filter.id] !== undefined);
  const activeSorts = table.sorting.flatMap((entry) => {
    const sortKey = table.sortKeys.find((key) => key.id === entry.id);
    return sortKey ? [{ desc: entry.desc, id: entry.id, label: sortKey.label }] : [];
  });

  if (activeFilters.length === 0 && activeSorts.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-2 list-none p-0 m-0 mb-2">
      {activeSorts.map((sort, index) => (
        <li key={`sort-${sort.id}`} className="p-0">
          <Tag
            small
            dismissible
            iconId={sort.desc ? 'fr-icon-arrow-down-line' : 'fr-icon-arrow-up-line'}
            nativeButtonProps={{
              onClick: () => table.setSorting(table.sorting.filter((entry) => entry.id !== sort.id)),
              title: 'Retirer ce tri',
            }}
          >
            {activeSorts.length > 1 ? `${index + 1}. ` : 'Tri : '}
            {sort.label}
          </Tag>
        </li>
      ))}
      {activeFilters.map((filter) => (
        <li key={`filter-${filter.id}`} className="p-0">
          <Tag
            small
            dismissible
            nativeButtonProps={{ onClick: () => table.setFilterValue(filter.id, undefined), title: 'Retirer ce filtre' }}
          >
            {filter.label} : {summarizeFilterValue(filter, filterValues[filter.id])}
          </Tag>
        </li>
      ))}
    </ul>
  );
}
