# admin module

Cross-cutting admin features that belong to no business module: the themes and the permanent counters of the admin dashboard.

The admin dashboard (`src/components/dashboard/DashboardAdmin.tsx`) is a work queue, not a navigation page (the menu lists the pages). It fits one screen: the permanent counters of this module on one row at the top, then the data anomalies of the `data-diagnostic` module in two columns, « À corriger » (errors) and « À vérifier » (warnings, followed by the on-demand checks). There are no sections by theme on the page — the same few people handle everything: the themes (`demands`, `networks`, `managers`, `accounts`, `technical`) only tag each anomaly line and group the documentation. Only show what an admin can act on.

**Counter or anomaly?** A counter is a work queue the team empties itself and that goes back to zero once handled: it is always displayed, even at zero. What does not depend on the team (managers not answering their demands: such a counter would stay positive forever) or only matters when it exists (yearly survey discrepancies, a broken link, an inconsistent permission) is an anomaly of the data diagnostic, displayed only when present. The whole list is rendered in the product documentation (`/admin/doc/role-admin`, `DashboardAlertsInventory`), generated from `adminDashboardIndicators` and `diagnosticChecks`.

## Structure

- `constants.ts` — `adminDashboardThemeIds` and `adminDashboardThemeLabels` (short: they are used as tags); `adminDashboardIndicators`: the permanent counters in display order (key, label, description, target page, theme), client-safe.
- `server/service.ts` — `getAdminDashboardIndicators()`: one count per indicator (demands to validate, pending reassignments, renewable heat demands to validate, pending network change requests, organization attachment drift (networks matching a pattern but unattached, attached out of any pattern), jobs in error over the last 7 days).
- `server/trpc-routes.ts` — router `admin` with `getDashboardIndicators` (admin only).
- `client/AdminDashboardIndicators.tsx` — the row of compact cards, refetched on every mount (`staleTime: 0`, the app default is 5 minutes) and every minute.

## Adding an indicator

Add an entry to `adminDashboardIndicators` with its theme (the type of the service result follows), the matching count in the service, and a line in the integration test. Keep each indicator actionable: it must point to the page where the items are handled.
