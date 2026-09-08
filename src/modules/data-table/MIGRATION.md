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

## Product-visible changes (to know before validating)

Behaviors that differ from `TableSimple`, on every migrated table:

- **Sorting**: first click on a header always sorts ascending; the sort criteria (columns or not) are also managed in the « Filtres et tri » dialog; active criteria and filters show as dismissible chips under the toolbar.
- **Filters**: facet counts are computed on the unfiltered data; a facet with no value selected is no filter; boolean facets are stored as `['true']` / `['false']`.
- **URL**: `<key>_filters` is now a JSON object keyed by filter id (was a TanStack array). Old bookmarks with the array form are ignored (no crash, default preset applies).
- **Rows**: fixed height (`sm` 40 px / `md` 56 px / `lg` 80 px); text cells truncate with the full value in a tooltip; the table scrolls in its own container capped at the viewport height.
- **Toolbar**: global search, results count, « Filtres et tri », presets, export and page actions live above the table, inside the table's own layout slot.
- **Dialogs**: every `window.confirm` met during a migration is replaced by `ConfirmDialog`.
- **Users**: the « Activé » column is gone, a « Désactivé » badge sits next to the email; the tag filter lists the tags in use (with counts) instead of the whole catalog.
- **Demandes admin**: search, presets and the eligibility help button moved inside the left panel; `Contact` shows 3 truncated lines (full details in the tooltip); comment textareas have 2 rows; the pending reassignment block is a warning button opening a popover (Valider / Rejeter inside); the map recenters only when the displayed set of demands changes (not on sort or edit).

## Validation checklist

Tick when checked on real data. Anything unchecked here is not validated, whatever the step table says.

### Module

- [ ] Scroll performance on a virtualized table (no dropped frames, no CPU when idle).
- [ ] Sticky header stays visible while scrolling inside the table.
- [ ] Column widths: px and `%` honoured, unsized columns share the rest, no overflow of the sort icon.
- [ ] « Filtres et tri » dialog: facets checkboxes vs combobox threshold (12 options), range slider, date range with « vides incluses », text, emptyOrFilled.
- [ ] Chips: remove one sort criterion / one filter; « Réinitialiser tout » clears both.
- [ ] URL sync: reload keeps search, sort and filters; the initial preset applies only on a URL without filters.
- [ ] Export xlsx: visible columns only, `export: false` respected, `extraColumns` present.

### `admin/users`

- [ ] Row height `md`: email + name and role + permissions summary fit on two lines.
- [ ] Badges « API » / « Désactivé » always visible next to a long email.
- [ ] Sort keys « Nom » and « Activé » (no column) in the dialog; initial sort on « Créé le » desc.
- [ ] Delete flow through `ConfirmDialog`.

### `admin/demandes` (pilot 2)

- [ ] Row height `lg`: Statut (select + eligibility button), Accès (up to 4 badges), Adresse (address + 2 badges + source address) — decide between compacting the cell and adding an `xl` step if one overflows.
- [ ] Toolbar in the 66 % panel: presets and search wrap acceptably around 1400 px.
- [ ] Table height `calc(100dvh - 290px)` fits under the toolbar without a page scrollbar.
- [ ] Map link: click / double-click a row centers the map; click a marker highlights and scrolls to the row; editing a comment or status does not recenter.
- [ ] Default preset « à valider » applied on a fresh URL; presets counts; « demandes totales » clears filters.
- [ ] Inbound links: stats page (`network_id`, `validated`, `Status`, `date`) and data diagnostic (`demands_filters={}` + search) open the expected list.
- [ ] Pending reassignment popover: Valider / Rejeter for admins; the warning button is visible on the row.
- [ ] Profiler before/after on prod-sized data: keystroke in search, scroll frame, row selection (numbers to record here).

### `admin/organisations`, `admin/jobs`, `Us`, `DebugDrawer`

- [ ] Organisations: actions column (480 px) fits; search and count useful.
- [ ] Jobs: reset / delete actions work from the page-level mutations; result cell on 3 lines.
- [ ] Us: percentages without decimals, no sort icons, centered 600 px table.
- [ ] DebugDrawer: the 11 tables render with horizontal scroll where needed.

## Steps

| # | Step | Status | Notes |
|---|------|--------|-------|
| 0 | Analysis, plan, decisions validated | ✅ | see this document |
| 1 | Core module: types, `useDataTable`, built-in filters, toolbar, `DataTable` rendering (plain + virtualized, fixed row heights), cells helpers, export, URL sync, specs, `AGENTS.md`, root index entry. Freeze notice on top of `TableSimple.tsx` (no new feature). | ✅ | 52 unit tests; sort first click is always ascending; facets on unfiltered data |
| 2 | Pilot 1: `pages/admin/users.tsx` (filters dialog, export, URL, flex widths, Boolean/Date cells). API validation. | ✅ | to be validated visually on real data |
| 3 | Pilot 2: `pages/admin/demandes.tsx` (30 columns, presets, map link, thousands of rows). Profiler measurements before/after on prod-sized data: keystroke in search, scroll frame, row selection. | 🟡 | migrated; measurements and visual validation pending |
| 4 | `pages/pro/demandes.tsx`, `pages/pro/mes-demandes.tsx` | ⬜ | share presets/filters with admin demands where possible |
| 5 | `chaleur-renouvelable/.../DemandesChaleurRenouvelableAdminPage.tsx` | ⬜ | |
| 6 | `demands/client/ReseauxStatsPage.tsx` | ⬜ | export-only columns → `exportColumns` |
| 7 | `conversion-tracking/.../ConversionStatsPage.tsx`, `ConversionAbusePage.tsx` | ⬜ | hidden sortable columns → `sortValue` / sort dialog |
| 8 | `organizations/.../AdminOrganizationsPage.tsx`, `pages/admin/jobs.tsx` | ✅ | jobs: hooks moved out of the cell renderers, `confirm()` → `ConfirmDialog` |
| 9 | `pro-eligibility-tests/.../ProEligibilityTestItem.tsx` | ⬜ | index-based selection → row ids; one export path |
| 10 | `reseaux/client/admin/AdminReseauxPage.tsx` (4 tables) | ⬜ | drop hand-computed height |
| 11 | `NetworksList/NetworksList.tsx` | ⬜ | drawer filters → table filters (custom where needed), unified export/search |
| 12 | `ComparateurPublicodes/DebugDrawer.tsx` (11 small tables), `components/Us.tsx` | ✅ | both on `StaticDataTable` |
| 13 | Delete `components/ui/table/*`, `QuickFilterPresets.tsx`; update docs | ⬜ | |

## Migrated tables

| Table | Notes |
|-------|-------|
| `components/Us.tsx` | `StaticDataTable`, `cells.percent()` |
| `ComparateurPublicodes/DebugDrawer.tsx` | 11 `StaticDataTable` with inline columns/data (mechanical replacement of `TableSimple fluid caption`) |
| `organizations/.../AdminOrganizationsPage.tsx` | typed row from `RouterOutput`; JSX header gets a `headerLabel`; gained the search input and results count |
| `pages/admin/jobs.tsx` | hooks (`usePost`/`useDelete`) hoisted to the page with URL functions, actions cell is pure; `confirm()` → `ConfirmDialog`; the JSON `result` column is narrowed with a local `JobResult` type (the old `getValue()` hid it as `any`); `rowHeight="lg"` for the 3-line result |
| `pages/admin/demandes.tsx` | 16 filters and 5 presets moved to `modules/demands/client/admin-demands-filters.tsx` (also typed source of the inbound links from the stats page and the data diagnostic); the 6 hidden filter-only columns are gone; `rowHeight="lg"` with adapted cells: `Contact` on 3 truncated lines (details in tooltip), `Comment` textareas on 2 rows, the pending reassignment block of `AffectedNetworkCell` becomes a warning button opening a popover; the module-level `isUpdatingDemandField` flag is replaced by the displayed-ids signature (map recenters only when the displayed set changes); `confirm()` → `ConfirmDialog`; URL `demands_filters` is now an object |
| `pages/admin/users.tsx` | 9 filters declared at table level (the hidden « Créé via API » column is gone); tag facets come from the data (with counts) instead of the tag catalog query; `users_filters` URL param is now an object (`{ active: ['true'] }`); percentage widths replace `flex`; row height `md` |

## Decisions log

- 2026-09-07 — TanStack Table kept; wrapper rewritten. Module location `src/modules/data-table/`.
- 2026-09-07 — Fixed row heights everywhere (`sm`/`md`/`lg`), no dynamic measurement; cells adapt.
- 2026-09-07 — Virtualization automatic above 100 rows, opt-in/out via prop.
- 2026-09-08 — `accessorColumn` helper for typed computed columns; `StaticDataTable` for small read-only tables; dev-mode warning on unstable columns (Biome's `useExhaustiveDependencies` is off project-wide, 167 diagnostics if enabled, and would not detect unstable hook results anyway).
- 2026-09-08 — Sorting decoupled from columns like filters (`sorts` keys); single « Filtres et tri » dialog; active sort/filter chips in the toolbar. Goal: no field needs a column to be sortable or filterable.
- 2026-09-08 — Page-scroll virtualization tried and dropped: the page became rows × height tall and DSFR makes `<table>` a scrolling block. Tables scroll in their own container capped at the viewport height by default (`height` overrides), so nothing has to be configured.
- 2026-09-07 — URL sync kept as simple as today (nuqs, JSON where needed); pretty params later.
- 2026-09-07 — Pilot order: `admin/users` then `admin/demandes`.
- 2026-09-07 — `TableSimple` frozen from step 1; full migration inside this chantier, then deletion.
