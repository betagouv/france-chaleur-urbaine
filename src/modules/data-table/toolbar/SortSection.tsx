import Select from '@codegouvfr/react-dsfr/Select';

import Button from '@/components/ui/Button';

import type { DataTableInstance } from '../useDataTable';

type SortSectionProps<Row> = {
  table: DataTableInstance<Row>;
};

/**
 * Sort criteria of the table: the active ones (rank, direction, remove) and a select to add another key.
 * Lists every sort key, columns or not, so sorting never depends on what is displayed.
 */
export function SortSection<Row>({ table }: SortSectionProps<Row>) {
  const activeKeys = table.sorting.flatMap((entry) => {
    const sortKey = table.sortKeys.find((key) => key.id === entry.id);
    return sortKey ? [{ ...sortKey, desc: entry.desc }] : [];
  });
  const availableKeys = table.sortKeys.filter((sortKey) => !table.sorting.some((entry) => entry.id === sortKey.id));

  const setDirection = (id: string, desc: boolean) =>
    table.setSorting(table.sorting.map((entry) => (entry.id === id ? { desc, id } : entry)));
  const remove = (id: string) => table.setSorting(table.sorting.filter((entry) => entry.id !== id));

  return (
    <section className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold leading-tight mb-0">Tri</p>
        {activeKeys.length > 0 && (
          <Button priority="tertiary no outline" iconId="ri-close-line" size="small" onClick={() => table.setSorting([])}>
            Réinitialiser
          </Button>
        )}
      </div>
      {activeKeys.length === 0 && <p className="text-sm text-gray-600 mb-0">Aucun tri. Les critères se combinent dans l'ordre d'ajout.</p>}
      {activeKeys.map((sortKey, index) => (
        <div key={sortKey.id} className="flex items-center gap-2">
          {activeKeys.length > 1 && (
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--background-action-high-blue-france) text-xs text-white">
              {index + 1}
            </span>
          )}
          <span className="flex-1 leading-tight">{sortKey.label}</span>
          <Button
            size="small"
            priority={sortKey.desc ? 'tertiary' : 'primary'}
            iconId="fr-icon-arrow-up-line"
            title="Croissant"
            onClick={() => setDirection(sortKey.id, false)}
          />
          <Button
            size="small"
            priority={sortKey.desc ? 'primary' : 'tertiary'}
            iconId="fr-icon-arrow-down-line"
            title="Décroissant"
            onClick={() => setDirection(sortKey.id, true)}
          />
          <Button
            size="small"
            priority="tertiary no outline"
            iconId="ri-close-line"
            title="Retirer ce critère"
            onClick={() => remove(sortKey.id)}
          />
        </div>
      ))}
      {availableKeys.length > 0 && (
        <Select
          label={activeKeys.length === 0 ? 'Trier par' : 'Ajouter un critère'}
          className="mb-0!"
          nativeSelectProps={{
            onChange: (event) => {
              if (event.target.value) {
                table.setSorting([...table.sorting, { desc: false, id: event.target.value }]);
              }
            },
            value: '',
          }}
        >
          <option value="">Choisir un champ…</option>
          {availableKeys.map((sortKey) => (
            <option key={sortKey.id} value={sortKey.id}>
              {sortKey.label}
            </option>
          ))}
        </Select>
      )}
    </section>
  );
}
