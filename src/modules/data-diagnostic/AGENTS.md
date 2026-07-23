# Data Diagnostic Module

> Admin-only data quality report. Detects inconsistencies in users, permissions, demands and organisations (network/gestionnaire-pattern curation).

## Structure

```
data-diagnostic/
├── AGENTS.md
├── constants.ts                # MAX_ITEMS_PER_ISSUE, severity labels
├── types.ts                    # Issue, IssueItem, IssueSeverity, DataDiagnosticResult
├── server/
│   ├── service.ts              # runDataDiagnostic + individual checks
│   └── trpc-routes.ts          # dataDiagnostic.run (adminRoute)
└── client/
    └── DataDiagnosticPage.tsx  # admin UI (IDE-like issue list)
```

## Purpose and boundaries

Read-only diagnostic. The module never mutates data — it only reports.

Each check returns `Issue | null`. Returning `null` means no anomaly: the issue is excluded from the response so the UI stays clean. All checks run in parallel via `Promise.all`.

Two severities only: `error` (broken / inconsistent state) and `warning` (suspicious but possibly legitimate). No `info` — purely informational lines were intentionally removed to avoid desensitising readers.

## API (tRPC routes)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `dataDiagnostic.run` | query | admin | Runs all checks and returns the consolidated result |

## Issue payload

```ts
type Issue = {
  type: string;                // stable id, e.g. 'user.no_permission'
  severity: 'error' | 'warning';
  title: string;               // FR — shown in the accordion header
  description: string;         // FR — explains what's wrong and how to fix
  totalCount: number;          // raw count from SQL
  truncated: boolean;          // true if items were capped at MAX_ITEMS_PER_ISSUE (1000)
  items: IssueItem[];          // capped list — each item carries an optional drill-down href + optional extra links
};
```

## Implemented checks

Errors (broken state):
- `user.no_permission` — active user with permission-bearing role but zero permissions
- `user.gestionnaire_with_territory` — gestionnaire holds a territory permission
- `user.role_without_permissions_has_permission` — admin/particulier/professionnel holds a permission
- `user.duplicate_email` — duplicate emails (case-insensitive)
- `permission.orphan_resource` — `resource_id` no longer exists in the referenced table
- `demand.network_id_type_mismatch` — `network_id`/`network_type` partially set
- `demand.orphan_network` — affected `network_id` no longer exists

Warnings (suspicious):
- `user.dormant` — active non-admin, no connection in > 1 year
- `demand.missing_coordinates` — `legacy_values.Latitude`/`Longitude` null
- `demand.unvalidated_old` — `validated=false` for > 30 days
- `demand.pending_assignment_stale` — `pending_assignment_change` open > 14 days
- `demand.recontact_mismatch` — status implies contact but demandeur answered "Non" to the satisfaction survey after the last real status change (chronology via events; fusion_statuts migration events excluded)
- `demand.recontact_mismatch_legacy` — same mismatch but chronology unknown: the "Non" predates the events system and no real status change is traced (frozen legacy population, manual review)
- `organization.without_networks` — organization with no heat/cold/under-construction network attached
- `user.national_candidate_unmigrated` — active account with ≥ 50 network permissions and no organization (migrate to org scope)
- `network.gestionnaire_split_across_organizations` — one `Gestionnaire` value mapped to several organizations

## Adding a new check

1. Write a new `IssueBuilder` in `server/service.ts`.
2. Return `null` early when the SQL returns zero rows.
3. Wrap rows with the local `truncate()` helper to enforce `MAX_ITEMS_PER_ISSUE`.
4. Register the builder in the `checks` array.

No client changes required — the UI renders any issue whose `severity` is known.

## Dependencies

- `@/server/db/kysely` — direct DB queries (no business module layer).
- `@/modules/trpc/server` — `adminRoute`, `router`.
- `@/components/ui/Accordion`, DSFR `Badge` — UI primitives.
