# doc module

Business workflow documentation for the product team, rendered under `/admin/doc` (admin-only pages).

## Structure

- `doc.config.ts` — registry of the documentation pages (slug, title, description, theme, MDX component) and themes (`intro` = glossary / onboarding, `parcours` = functional workflows, `roles` = per-role pages labelled "Rôles utilisateurs", `references` = generated inventories). Adding a page = adding an MDX file + one entry here.
- `content/*.mdx` — the documentation content, written in **French** (product-team audience — this is UI content, not AI docs, so the English-docs convention does not apply). GFM tables are enabled; diagrams use `<Mermaid chart={...} />`; inventory components are available in scope without import (`<EmailsInventory />`, `<CronsInventory />`, `<DemandStatuses />`, `<FcrDemandStatuses />`, `<EventsInventory />`, `<Rule id="…" />`).
- **Register**: professional French, no anglicisms — « correspond » not « matche », « entonnoir » not « funnel », « tâche » not « job », « archivé » not « historisé », « tri » not « triage ». Established technical terms stay: cron, email, badge, CSV.
- `client/DocArticle.tsx` — renders a page's MDX with styled tables, the `Mermaid` component and the inventories.
- `client/Mermaid.tsx` — lazy-loaded client-side Mermaid renderer, follows DSFR dark mode. `securityLevel: 'loose'` enables click links on nodes (safe: charts are static repo content). Clickable nodes get a ↗ marker + hover styles automatically.
- `client/inventories/*` — tables generated from code registries (email registry `trigger` field, `cron.config.ts`, `DEMANDE_STATUS`, `demandeChaleurRenouvelableStatuses`, events catalog): they cannot drift. `event-groups.ts` holds the events grouping (shared with the coverage test).
- `client/Rule.tsx` + `@/modules/app/business-rules` (`src/modules/app/business-rules.ts`) — numeric thresholds/delays. **Never hardcode a business number in the MDX**: use `<Rule id="…" />`, which reads `src/modules/app/business-rules.ts`. A number belongs in that registry **only if its production definition also reads it from there** (e.g. `src/services/eligibility.ts`, `src/modules/demands/server/eligibility.ts`) — that is what makes the doc and the code provably equal. A `<Rule>` can't be used inside a Mermaid `chart` string, but the chart is a template literal: `import { businessRules } from '@/modules/app/business-rules'` at the top of the MDX and interpolate `${businessRules.x.display}` so diagrams stay drift-proof too.
- `doc-coverage.spec.ts` — unit test that turns the build red when: an email is not referenced in any narrative page, a new event type would fall silently into the catch-all "Système" group, or a `<Rule id>` points to an unknown key.
- **Full-text search** — `client/DocSearch.tsx` (search box on `/admin/doc`, nuqs `q`) over `client/search.ts` (accent-insensitive ranker) reading `search-index.generated.ts`. The index is built by the CLI command `pnpm doc:build-search-index` (`commands.ts` → `commands/build-search-index.ts`, which strips MDX via `search-extract.ts` and resolves `<Rule>` to its value so thresholds are searchable). Generated file is **committed** (repo convention: generated code is versioned, like kysely `database.ts`); `search-index.spec.ts` reddens the build if it is stale. **Regenerate after editing any `content/*.mdx`.**

## Chart conventions (flowcharts)

- Color nodes by side-effect type with these classDefs (copy them into each chart):
  - `email` (yellow `#feecc2`) = email sent · `crm` (purple `#e3d9fd`) = ADEME Connect sync · `evt` (blue `#cfe3fd`) = audit event · `db` (green `#d3f4d3`) = database write.
- Make email/event nodes clickable with `click <nodeId> "/admin/emails?type=<emailKey>"` and `click <nodeId> "/admin/events?types=<eventType>"` (both pages read these query params via nuqs).
- Deep links also work in prose/tables: link email names to `/admin/emails?type=…` and event labels to `/admin/events?types=…`; cross-link doc pages with `/admin/doc/<slug>`.

## Purpose & boundaries

- Owns: the documentation content and its rendering. No DB tables, no tRPC routes, no business logic.
- The content documents behavior implemented in other modules (auth, users, demands, email…). It is a description, never a source of behavior.

## Maintenance rule (important)

Any change to business behavior (emails sent, statuses, transitions, crons, permissions, eligibility rules) MUST update the related `content/*.mdx` file in the same PR. Verify every claim against the code when writing — this documentation is the product team's source of truth, a wrong statement is worse than a missing one.

Numeric rules are the exception that must not rely on this discipline: put them in `src/modules/app/business-rules.ts`, wire production to read them, and render them with `<Rule>`. `doc-coverage.spec.ts` enforces part of this automatically. When you change a number, change it in `src/modules/app/business-rules.ts` and both the code and the doc follow.
