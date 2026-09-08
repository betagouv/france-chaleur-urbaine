import { fireEvent, render, screen, within } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import { cells } from './cells';
import { DataTable } from './DataTable';
import type { FilterDef } from './filters/filter-types';
import type { DataTableColumn } from './types';
import { useDataTable } from './useDataTable';

type Row = { id: string; name: string; count: number; active: boolean };

const makeRows = (length: number): Row[] =>
  Array.from({ length }, (_, index) => ({ active: index % 2 === 0, count: length - index, id: `row-${index}`, name: `Réseau ${index}` }));

const columns: DataTableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'count', header: 'Compte', width: 80 },
  { accessorKey: 'active', cell: cells.boolean(), header: 'Actif' },
];

const filters = [
  { getValue: (row: Row) => row.active, id: 'active', label: 'Actif', type: 'facets' },
] as const satisfies readonly FilterDef<Row>[];

type HarnessProps = { data: Row[]; virtualize?: boolean | 'auto'; withFilters?: boolean; onRowClick?: (row: Row) => void };

function Harness({ data, virtualize = 'auto', withFilters = false, onRowClick }: HarnessProps) {
  const table = useDataTable({ columns, data, filters: withFilters ? filters : undefined, getRowId: (row) => row.id });
  return (
    <>
      <span data-testid="count">{table.rows.length}</span>
      <DataTable table={table} virtualize={virtualize} search onRowClick={onRowClick} />
    </>
  );
}

const renderHarness = (props: HarnessProps) => render(<Harness {...props} />, { wrapper: withNuqsTestingAdapter() });

describe('DataTable', () => {
  it('renders every row of a small dataset without virtualization, with default and custom cells', () => {
    renderHarness({ data: makeRows(3) });
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toStrictEqual(['Réseau 0', '3', 'Oui']);
  });

  it('virtualizes large datasets: only a window of rows is in the DOM', () => {
    renderHarness({ data: makeRows(500), virtualize: true });
    expect(screen.getAllByRole('row').length).toBeLessThan(100);
    expect(screen.getByTestId('count').textContent).toStrictEqual('500');
  });

  it('filters rows through the global search and shows the empty state', () => {
    renderHarness({ data: [...makeRows(4), { active: true, count: 99, id: 'row-x', name: 'Réseau très éloigné' }] });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tres eloigne' } });
    expect(screen.getByTestId('count').textContent).toStrictEqual('1');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing' } });
    expect(screen.getByText('Aucun résultat trouvé, élargissez votre recherche')).toBeTruthy();
  });

  it('sorts when clicking a header sort button', () => {
    renderHarness({ data: makeRows(3) });
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Compte/ })).getByRole('button'));
    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getAllByRole('cell')[1].textContent).toStrictEqual('1');
  });

  it('shows the « Filtres et tri » button when filters are declared', () => {
    renderHarness({ data: makeRows(3), withFilters: true });
    expect(screen.getByRole('button', { name: 'Filtres et tri' })).toBeTruthy();
  });

  it('shows removable chips for the active sort and the results count', () => {
    renderHarness({ data: makeRows(3) });
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Compte/ })).getByRole('button'));
    expect(screen.getByText('3 résultats')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tri : Compte/ }));
    expect(screen.queryByText(/Tri : Compte/)).toBeNull();
  });

  it('calls onRowClick with the row item', () => {
    const clicked: Row[] = [];
    renderHarness({ data: makeRows(2), onRowClick: (row) => clicked.push(row) });
    fireEvent.click(screen.getAllByRole('row')[2]);
    expect(clicked.map((row) => row.id)).toStrictEqual(['row-1']);
  });
});
