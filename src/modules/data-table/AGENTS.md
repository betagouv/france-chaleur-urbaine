# Module: data-table

Data table for lists of the app (admin, pro, stats): `useDataTable` (state + derived data) and `DataTable` (rendering). Replaces `src/components/ui/table/TableSimple.tsx` (frozen, being migrated — see [MIGRATION.md](./MIGRATION.md)).

## Usage

```tsx
import { DataTable } from '@/modules/data-table/DataTable';
import { cells } from '@/modules/data-table/cells';
import type { FilterDef } from '@/modules/data-table/filters/filter-types';
import type { DataTableColumn } from '@/modules/data-table/types';
import { useDataTable } from '@/modules/data-table/useDataTable';

const columns: DataTableColumn<User>[] = [
  { accessorKey: 'email', header: 'Email', cell: ({ row, value }) => <UserEmail user={row} email={value} /> },
  { accessorKey: 'created_at', header: 'Créé le', cell: cells.date(), width: 120 },
  { accessorFn: (row) => row.tags.map((tag) => tag.name), id: 'tags', header: 'Étiquettes', sortValue: (row) => row.tags.length },
  { id: 'actions', header: '', cell: ({ row }) => <UserActions user={row} />, width: 50, export: false },
];

const filters = [
  { id: 'role', type: 'facets', label: 'Rôle', getValue: (row) => row.role },
  { id: 'created_at', type: 'dateRange', label: 'Créé le', getValue: (row) => row.created_at },
] as const satisfies readonly FilterDef<User>[];

const table = useDataTable({ data: users, columns, filters, getRowId: (row) => row.id, urlKey: 'users', initialSorting: [{ id: 'created_at', desc: true }] });

<DataTable table={table} rowHeight="md" exportConfig={{ fileName: 'utilisateurs.xlsx', sheetName: 'utilisateurs' }} />
```

`columns` and `filters` must be memoized (`useMemo` or module scope). Any external state read by a `cell` goes in the columns' `useMemo` dependencies: rows re-render when the columns array changes, and only then.

## Principles

- **Column = display.** `accessorKey` (typed `value` in `cell`) or `accessorFn` + `id`, or display-only (`id` + `cell`). Extras: `align`, `width` (px number or CSS string; unsized columns share the remaining space), `sortable`, `sortValue` (sort key for multi-value cells, nulls last), `export` (`false` or `{ header, value }`), `hidden`, `headerLabel` (plain text for the sort dialog/export when `header` is JSX). Formatters: `cells.date() / dateTime() / number() / price() / percent() / boolean() / list()`.
- **Filters live at table level, independent from columns.** Types: `facets` (values or arrays of values, options and counts computed once per data, checkboxes or combobox), `range`, `dateRange` (`{ from, to, includeEmpty }`), `text`, `emptyOrFilled`, `custom` (`predicate` + `render`). Values are typed per filter (`FilterValuesOf`); `undefined` = inactive. All predicates run in one memoized pass before TanStack.
- **State**: search, sorting and filter values, local by default or in the URL with `urlKey` (`<urlKey>_search`, `<urlKey>_sort`, `<urlKey>_filters`, JSON via nuqs). `initialSorting` / `initialFilters` apply when the URL has nothing.
- **Rendering**: real `<table>` (DSFR `fr-table`), sticky header, fixed row height (`rowHeight: 'sm' | 'md' | 'lg'` = 1/2/3 lines, text cells clamp with a `title`), `virtualize: 'auto'` above 100 rows using spacer rows (same DOM in both modes, no measurement). Rows are memoized on item identity, columns and flags.
- **Identity**: `getRowId` is required; `selectedRowId` highlights a row, `enableRowSelection` + `rowSelection`/`onRowSelectionChange` (TanStack `RowSelectionState` keyed by row id) selects. `table.scrollToRow(id)` scrolls in both modes.
- **Toolbar**: `search` (default on), `filtersDialog` (default on when filters exist), `sortDialog`, `presets` (quick filter sets with counts; active when values match exactly), `exportConfig` (visible columns + `extraColumns`), `actions` slot.

## Files

`types.ts` (columns, options, presets) · `filters/filter-types.ts` + `filter-predicates.ts` (pure, tested) · `search.ts` · `sorting.ts` · `columns.ts` (resolution + TanStack mapping) · `cells.tsx` · `export.ts` · `useDataTableState.ts` (nuqs/local) · `useDataTable.ts` · `DataTable.tsx` + `DataTableBody.tsx` + `DataTableRow.tsx` + `DataTableHeaderCell.tsx` · `filters/FiltersDialog.tsx` + `FilterControl.tsx` · `toolbar/*` · `constants.ts`.

## Boundaries

- No server-side pagination: pages load the full dataset; the table keeps it cheap client-side.
- Facet counts are computed on the unfiltered data (stable options, one computation per dataset).
- Do not add page-specific props: compose with `actions`, `custom` filters and `cell` renderers instead.
