# Data Diagnostic Module

> Admin-only data quality checks, shown on the admin dashboard. Detects inconsistencies in users, permissions, demands, networks and organisations.

## Structure

```
data-diagnostic/
├── AGENTS.md
├── constants.ts                # diagnosticChecks (registry of every check), zRunDataDiagnosticInput, MAX_ITEMS_PER_ISSUE
├── types.ts                    # Issue, IssueItem, IssueSeverity
├── server/
│   ├── service.ts              # runDataDiagnostic({ onDemand }) + one builder per check
│   └── trpc-routes.ts          # dataDiagnostic.run (adminRoute)
└── client/
    ├── DataDiagnosticIssues.tsx        # the two columns of the dashboard: errors to fix, warnings to check
    ├── DataDiagnosticOnDemandChecks.tsx # under the warnings: the on-demand checks behind a button
    ├── DataDiagnosticIssueList.tsx     # a list of issues, its loading and empty states
    └── DataDiagnosticIssue.tsx         # one issue (compact accordion: count, title, theme tag, then description and items)
```

## Purpose and boundaries

Read-only diagnostic. The module never mutates data — it only reports. It has no page of its own: the admin dashboard (`src/components/dashboard/DashboardAdmin.tsx`) renders `DataDiagnosticIssues` below the permanent counters of the `admin` module (which owns the theme list, `adminDashboardThemeIds`).

**`diagnosticChecks` (constants.ts) is the single source of the checks**: type, title and description shown to the admins, severity, dashboard theme, and `onDemand`. The service only holds the query of each check (`builders`, one per type, enforced by `Record<DiagnosticCheckType, …>`); the product documentation lists them from the same registry (`DashboardAlertsInventory`, rendered in `/admin/doc/role-admin`). Never keep another hand-written list of the checks.

A builder returns its items or `null`. `null` means no anomaly: the issue is excluded from the response, so an anomaly is displayed only while it exists. A run covers every check of the dashboard display, in parallel via `Promise.all`, errors first then by number of items. The client sends it outside the tRPC batch (`skipBatch`), so the counters fired with it are not held back.

**On-demand checks** (`onDemand: true`): too slow, and too rarely a priority, to run at every display of the dashboard — today the two spatial comparisons between networks and PDP perimeters. They run only when the admin clicks the button under the warnings column (labelled for the PDP geometry: reword it if another kind of check becomes on demand); their issues are then added to that column.

Two severities only: `error` (broken / inconsistent state, to fix) and `warning` (suspicious but possibly legitimate, to check). No `info` — purely informational lines were intentionally removed to avoid desensitising readers. Same reason for the checks removed in November 2026: dormant accounts (noise), late validations and late reassignments (already counted by the dashboard counters).

**Prefer a database constraint to a check.** A state that must never exist is forbidden by the schema, not reported afterwards: half-filled demand assignment (`demands_network_id_with_type`) and emails differing only by case (`users_email_lowercase`, which makes the existing unique constraint case-insensitive) used to be checks.

**A check or a dashboard counter?** A work queue the team empties itself, and that goes back to zero, is a permanent counter of the `admin` module (the organization attachment drift is one). Everything else is a check here.

## API (tRPC routes)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `dataDiagnostic.run` | query | admin | Input `{ onDemand }`. Runs the checks of every dashboard display, or the on-demand ones, and returns their issues (each with its theme) |

## Issue payload

```ts
type Issue = {
  type: string;                // stable id, e.g. 'user.no_permission'
  severity: 'error' | 'warning';
  theme: AdminDashboardThemeId; // tag of the line on the dashboard
  title: string;               // FR — shown in the accordion header
  description: string;         // FR — explains what's wrong and how to fix
  totalCount: number;          // raw count from SQL
  truncated: boolean;          // true if items were capped at MAX_ITEMS_PER_ISSUE (1000)
  items: IssueItem[];          // capped list — each item carries an optional drill-down href + optional extra links
};
```

## Notes on some checks

The list of checks lives in `diagnosticChecks`. Only what the registry cannot say is noted here:

- `demand.orphan_network` — should stay empty: a network deletion reassigns its demands (`reassignDemandsOfDeletedNetworks`); `reseaux:reassign-orphan-demands` repairs a deletion made outside the admin.
- `pdp.missing_network_link` (on demand) — heat networks: classified + open to connections, i.e. dark green on the map; under-construction networks/zones: open to connections. Links = `reseau_de_chaleur_ids`, `reseau_en_construction_ids`, SNCU id.
- `pdp.link_without_intersection` (on demand) — networks without geometry are skipped.
- `demand.recontact_mismatch` — chronology via events; fusion_statuts migration events excluded. `demand.recontact_mismatch_legacy` is the same mismatch with an unknown chronology (the "Non" predates the events system): a frozen population.
- `network.gestionnaire_split_across_organizations` — only partly covered by the organization drift counter of the dashboard (not when the second organization has no pattern, or when both patterns match).
- `custom_territory.stale_communes` / `custom_territory.orphan_recipe_ref` — detections owned by the custom-territories module (`findStaleCustomTerritories`, shared with the refresh; `findCustomTerritoriesWithOrphanRefs`, which the refresh does not fix).
- `demands` theme: no check yet, only counters.

## Adding a new check

1. Add its entry to `diagnosticChecks` (constants.ts): type, French title and description (what is wrong and how to fix it), severity (`error` only for a state to fix), its theme, and `onDemand` (`true` only for a slow check: every other check runs at each display of the dashboard, keep it cheap).
2. Write its `IssueBuilder` in `server/service.ts` and register it in `builders` (TypeScript fails until it is).
3. Return `null` early when the SQL returns zero rows, otherwise wrap the rows with the local `truncate()` helper (enforces `MAX_ITEMS_PER_ISSUE`).
4. Give each item an `href` to the screen where it is fixed, targeting the item when the page allows it (user: `userHref`, PDP: `pdpHref` — `/admin/reseaux?reseauxTab=…&reseauId=…` selects the row, demand: `demandHref`).

No client change and no documentation to write: the dashboard and the product documentation both read the registry.

## Performance

Measured in production on 2026-11-18, when the checks still had their own page: it took 19.5 s, of which 19.3 s in `pdp.link_without_intersection` (`ST_Intersects` on whole geometries, each linked pair computed twice). Production runs GEOS 3.11, about 100 times slower than the local GEOS 3.13 on these geometries, so **a local timing does not predict production for spatial checks**. `networkCrossesPdp` tests the network part by part (`ST_Dump` + bounding box + `ST_Intersects`, first hit wins): about 1 s on both versions. Both PDP checks are now on demand, so this cost is no longer paid at every display. The under-construction side of `pdp.missing_network_link` keeps whole geometries (zones are polygons, part by part is slower there). To benchmark a spatial check, load the three network tables into a Debian `postgis/postgis:16-3.5` container (GEOS 3.9) rather than trusting the local database.

## Dependencies

- `@/server/db/kysely` — direct DB queries (no business module layer), except detections owned by a module and shared with its fix (`organizations`, `custom-territories`).
- `@/modules/admin/constants` — the themes that tag each check.
- `@/modules/trpc/server` — `adminRoute`, `router`.
- `@/components/ui/Accordion`, DSFR `Badge` — UI primitives.
