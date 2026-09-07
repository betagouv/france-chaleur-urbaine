# Data table migration — plan & status

> Living document for the replacement of `src/components/ui/table/TableSimple.tsx` by the
> `DataTable` component of this module. Update the status section whenever a step or a table
> migration lands. The API and patterns are documented in [AGENTS.md](./AGENTS.md) once step 1 lands.

## Why

`TableSimple` (1139 lines, 34 instances in 16 files, zero test, ~40 commits of accretion) is slow and
hard to use:

- **Broken memoization by construction**: custom cells opt out of memo (`forceCellRender`), the row
  key embeds the selection state (remount on select), `columns` is passed only to bust the memo, and
  `TableCell` deep-compares `data` for a memo that never applies to custom cells.
- **Facets recomputed per column on every filter change** over the whole dataset (14 facets on the
  demands table).
- **Dynamic row-height measurement** (`measureElement`) forces a layout per rendered row; rows are
  `position: absolute` + CSS grid, and every non-JSX cell is an `overflow-auto` scroll container.
- **Two configuration languages**: `cellType`/`filterType`/`filter`/`sorting`/`visible`/`width|flex`
  duplicate TanStack's `filterFn`/`sortingFn`/`columnVisibility`/`size`; the component mutates the
  caller's column defs on every render to reconcile them, with `as any` casts on both sides.
- **Filters coupled to columns**: hidden `visible: false` columns exist only to carry a filter
  (6 occurrences), and a column holding several values cannot be filtered or sorted cleanly.
- **Weak typing**: `any` on cell values, filter values, `rowIdKey`, row ids (`(row.original as any)`),
  `width`/`flex` union resolved through `any`, `QuickFilterPreset` ids cast `as any` in pages.
- **Parallel mechanisms**: three export systems, two search-input patterns, `QuickFilterPresets`
  owning its own filter state, URL sync on 6 instances only (JSON blobs).
- **Bugs**: `onFilterChange` never fires on zero rows (stale map pins), row identity is index-based in
  TanStack but id-based for selection, static DOM ids duplicated in the filters dialog.
- **Not responsive**: ~150 pixel widths, hand-summed heights.

## Target design (`DataTable`)

Module `src/modules/data-table/` (`AGENTS.md`, `DataTable.tsx`, `useDataTable.ts`, `filters/`,
`cells.tsx`, `toolbar/`, `export.ts`, `url-state.ts`, specs next to sources). TanStack Table stays
(headless row model, sorting, selection) and TanStack Virtual stays (opt-in virtualization).

### Principles

1. **Column = display only.** A thin TanStack `ColumnDef` with a typed `meta`:
   `header`, `accessorKey | accessorFn`, `cell`, `align`, `width?` (`number` px | `'auto'` |
   `minmax` string), `sortValue?: (row) => Primitive` for multi-value columns, `export?`.
   No `cellType`: pure helpers `cells.date()`, `cells.dateTime()`, `cells.number()`, `cells.price()`,
   `cells.percent()`, `cells.boolean()`, `cells.array()` return a renderer.
2. **Filters are declared at table level, independent from columns.**
   `filters: FilterDef<Row>[]` with built-in types (`facets`, `range`, `dateRange`, `text`,
   `boolean`, `emptyOrFilled`) reading `getValue: (row) => …`, plus `custom` (`render` + `predicate`).
   All predicates run in a single memoized pass on `data` before TanStack; facet options and counts are
   computed once per `data`, never per filter change. Filter values are typed per filter type
   (discriminated union), no `any`.
3. **One toolbar**: global search (search index precomputed once per row), Filtres button opening a
   dialog listing every filter with an active-count badge, optional Trier dialog, quick presets
   (replaces `QuickFilterPresets`), single export path, `actions` slot.
4. **Fixed row height, no measurement.** Rows are `rowHeight: 'sm' | 'md' | 'lg'` (single-line,
   two-line, three-line budgets) applied on every table, virtualized or not. Cells truncate
   (`truncate` / `line-clamp-2`) with `title` on overflow; multi-line content is designed for the
   budget. `measureElement` is not used. Tables that need taller rows pick `lg`, not a per-table
   pixel value. Migrations must adapt cells that currently rely on free height (comments, addresses,
   tag lists).
5. **Same DOM in both render modes.** A real DSFR `<table>` with `<colgroup>`; `table-layout: fixed`
   only when at least one column declares a width, otherwise `auto`. Virtualization is
   `virtualize: 'auto' | boolean` (auto = above 100 rows) implemented with top/bottom spacer rows, so
   header and body always align and no grid/absolute positioning is needed.
6. **Cheap rendering.** Rows memoized on `row.original` identity, `isSelected`, and the columns
   array. Cells rendered by `flexRender` directly, no wrapper, no deep equality. Callers keep columns
   in `useMemo` and put any external state the cells read in its dependencies (this invalidates the
   rows that need it, nothing else).
7. **Single row identity** via `getRowId` (required, defaults to `row.id`). Highlight is
   `selectedRowId` + `onRowClick`; multi-selection is a separate `selection` / `onSelectionChange`
   keyed by row id. Imperative `scrollToRow(id)` through a `ref` handle (needed by the map link).
8. **URL sync kept simple**: `urlKey` prop; search, sort and the filters object are stored with nuqs
   as they are today (one param per concept, JSON where needed). Readable per-filter params are a
   later improvement, not a goal of this migration.
9. **Strict typing end to end**: row type flows into columns, filters, presets, export and
   callbacks; no `as any` inside the module; `pnpm ts` clean is a delivery criterion for every step.
10. **Tests**: vitest on filter predicates, facet computation, search index, sort values, URL
    (de)serialization, and a rendering test covering both render modes and selection.

### Explicit non-goals (this migration)

- Server-side pagination (the demands ↔ map workflow needs the full filtered set client-side).
- Mobile "card" layout for admin tables: a horizontal scroll container is the accepted behavior.
- `EventsList` / `VirtualList` and `TableBasic` stay as they are.

## Steps

| # | Step | Status | Notes |
|---|------|--------|-------|
| 0 | Analysis, plan, decisions validated | ✅ | see this document |
| 1 | Core module: types, `useDataTable`, built-in filters, toolbar, `DataTable` rendering (plain + virtualized, fixed row heights), cells helpers, export, URL sync, specs, `AGENTS.md`, root index entry. Freeze notice on top of `TableSimple.tsx` (no new feature). | ✅ | 52 unit tests; sort first click is always ascending; facets on unfiltered data |
| 2 | Pilot 1: `pages/admin/users.tsx` (filters dialog, export, URL, flex widths, Boolean/Date cells). API validation. | ⬜ | |
| 3 | Pilot 2: `pages/admin/demandes.tsx` (30 columns, presets, map link, thousands of rows). Profiler measurements before/after on prod-sized data: keystroke in search, scroll frame, row selection. | ⬜ | success criterion of the perf work |
| 4 | `pages/pro/demandes.tsx`, `pages/pro/mes-demandes.tsx` | ⬜ | share presets/filters with admin demands where possible |
| 5 | `chaleur-renouvelable/.../DemandesChaleurRenouvelableAdminPage.tsx` | ⬜ | |
| 6 | `demands/client/ReseauxStatsPage.tsx` | ⬜ | export-only columns → `exportColumns` |
| 7 | `conversion-tracking/.../ConversionStatsPage.tsx`, `ConversionAbusePage.tsx` | ⬜ | hidden sortable columns → `sortValue` / sort dialog |
| 8 | `organizations/.../AdminOrganizationsPage.tsx`, `pages/admin/jobs.tsx` | ⬜ | jobs: remove hooks called inside cell renderers |
| 9 | `pro-eligibility-tests/.../ProEligibilityTestItem.tsx` | ⬜ | index-based selection → row ids; one export path |
| 10 | `reseaux/client/admin/AdminReseauxPage.tsx` (4 tables) | ⬜ | drop hand-computed height |
| 11 | `NetworksList/NetworksList.tsx` | ⬜ | drawer filters → table filters (custom where needed), unified export/search |
| 12 | `ComparateurPublicodes/DebugDrawer.tsx` (11 small tables), `components/Us.tsx` | ⬜ | non-virtualized mode |
| 13 | Delete `components/ui/table/*`, `QuickFilterPresets.tsx`; update docs | ⬜ | |

## Migrated tables

| Table | Notes |
|-------|-------|
| _none yet_ | |

## Decisions log

- 2026-09-07 — TanStack Table kept; wrapper rewritten. Module location `src/modules/data-table/`.
- 2026-09-07 — Fixed row heights everywhere (`sm`/`md`/`lg`), no dynamic measurement; cells adapt.
- 2026-09-07 — Virtualization automatic above 100 rows, opt-in/out via prop.
- 2026-09-07 — URL sync kept as simple as today (nuqs, JSON where needed); pretty params later.
- 2026-09-07 — Pilot order: `admin/users` then `admin/demandes`.
- 2026-09-07 — `TableSimple` frozen from step 1; full migration inside this chantier, then deletion.
