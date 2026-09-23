# retention module

Manual application of the personal-data retention rules published in the privacy policy (`src/modules/legal/content/politique-de-confidentialite.mdx`). Admin-only, no cron: an admin previews then archives, and every run is recorded as a `data_retention_applied` event.

## Structure

- `constants.ts` — `retentionRules` and their client-safe definitions (title, description, action, list shortcut, business rule id). Durations live in `businessRules.retention*` so the admin page, the product doc and the code cannot drift.
- `server/service.ts` — one query per rule (`pending_accounts`: delete never-activated accounts; `inactive_accounts`: deactivate + anonymize non-admin accounts, demands stay linked; `closed_demands`: anonymize identity, contact and comments of demands in a terminal status or soft-deleted). `previewRetention` returns counts + a sample, `applyRetentionRule` archives and logs.
- `server/trpc-routes.ts` — `retention.preview` (query), `retention.apply` (mutation), both `adminRoute`.
- `client/AdminRetentionPage.tsx` — `/admin/retention`: a card per rule, preview dialog, confirmed archiving.

## Rules

- Anonymized rows are marked by an email starting with `anonymise-` and are excluded from later previews.
- Adding a rule: business rule + `retentionRules` + definition + service query/apply + doc page `retention-donnees.mdx` + privacy policy.
- Contact / contribution forms are not covered: they live in Airtable / Grist, not in the database.
