# admin module

Cross-cutting admin features that belong to no business module: the dashboard indicators.

## Structure

- `constants.ts` — `adminDashboardIndicators`: the list of « à traiter » counters (key, label, description, target page), client-safe.
- `server/service.ts` — `getAdminDashboardIndicators()`: one count per indicator (demands to validate, pending reassignments, renewable heat demands to validate, pending network change requests, organization attachment drift (networks matching a pattern but unattached, attached out of any pattern), jobs in error over the last 7 days).
- `server/trpc-routes.ts` — router `admin` with `getDashboardIndicators` (admin only).
- `client/AdminDashboardIndicators.tsx` — cards rendered at the top of the admin dashboard (`DashboardAdmin`), refetched on every mount (`staleTime: 0`, the app default is `Infinity`) and every minute.

## Adding an indicator

Add an entry to `adminDashboardIndicators` (the type of the service result follows), the matching count in the service, and a line in the integration test. Keep each indicator actionable: it must point to the page where the items are handled.
