# Architecture & Structure

## Stack flow
```
Browser → Next.js Pages Router → React (DSFR + Tailwind + MapLibre)
  → tRPC client → tRPC routes (modules/*/server/trpc-routes.ts)
    → services (business logic) → Kysely → PostgreSQL + PostGIS
```
Async work runs on a PostgreSQL-backed job queue + cron (tile generation, bulk eligibility, Airtable sync).

## Layers (and what each must NOT do)
| Layer | Location | Must NOT |
|-------|----------|----------|
| Pages | `src/pages/` | contain business logic |
| Components | `src/components/` | call DB or services directly |
| Hooks | `src/hooks/` | import server code |
| Module client | `src/modules/*/client/` | access DB or server internals |
| tRPC routes | `src/modules/*/server/trpc-routes.ts` | contain business logic |
| Services | `src/modules/*/server/*-service.ts` | know about HTTP / tRPC |
| Kysely | `src/server/db/kysely/` | contain business logic |
| Migrations | `src/server/db/migrations/` | be edited after application |

## Modules
Domain code lives in self-contained modules `src/modules/<name>/`:
```
<name>/
  AGENTS.md        # module doc — read before editing/importing
  constants.ts     # Zod schemas + constants
  types.ts
  server/          # server-only: <name>-service.ts, trpc-routes.ts
  client/          # client-only: hooks, components
```
- **Infrastructure**: trpc, auth, jobs, events, notification, security, config, optimization, app.
- **Business**: reseaux, demands, pro-eligibility-tests, tiles, map, users, data, email, ban, bdnb, geo, opendata, chaleur-renouvelable, form, analytics, diagnostic.

**Import rules**: within a module → relative; between modules → `@/modules/<other>/...`; client code **never** imports from any `server/`; server code **never** imports `@/components` or `@/pages`.

## Where to put new code
| Creating… | Location |
|-----------|----------|
| Feature / domain logic | `src/modules/<feature>/` (server service + `trpc-routes.ts`) |
| Zod schema | `src/modules/<domain>/constants.ts` |
| Module types | `src/modules/<domain>/types.ts` |
| Page | `src/pages/<route>.tsx` |
| Shared UI primitive | `src/components/ui/` |
| Feature component | `src/components/<Feature>/` |
| Form component | `src/components/form/` |
| Map layer | `src/modules/map/client/layers/specs/` |
| Hook | `src/hooks/use<Name>.ts` |
| Shared type | `src/types/` |
| Utility | `src/utils/<name>.ts` |
| Test | next to source: `<name>.spec.ts` / `.integration.spec.ts` |
| DB migration | `src/server/db/migrations/YYYYMMDDHHMMSS_description.ts` |
| Email template | `src/modules/email/` |

## Entry points
- `src/pages/_app.tsx` — providers (see nextjs-patterns.md).
- `src/modules/trpc/trpc.config.ts` — router composition; `src/modules/trpc/server/context.ts` — context builder.
- `src/server/db/kysely/database.ts` — generated DB types (single source of truth, 99+ tables, don't edit).
- `src/server/authentication.ts` — NextAuth config; `next.config.ts` — redirects / CSP / Sentry / MDX.
- `src/modules/map/` — the interactive map (see its `AGENTS.md`).

## Legacy (migrate when touching)
Pre-module code remains in `src/server/services/` and `src/services/`. New features always go in modules; touching legacy is an opportunity to migrate it.

## Key decisions (the why)
- **Pages Router, not App Router** — stable, full DSFR compatibility; no migration planned.
- **Kysely over Prisma** — SQL control, PostGIS, types generated from the real schema.
- **tRPC over REST** — end-to-end type safety; legacy REST routes are not extended.
- **Module-based over MVC** — each domain self-contained, easy to test/migrate.
- **PostgreSQL job queue over Redis** — simpler infra, transactional with business data.
- **DSFR** (government mandate) + Tailwind (`important: true`) on top. **styled-components deprecated** (legacy only).

## New module checklist
Add an `AGENTS.md`: one-line purpose · structure · purpose & boundaries (what it owns / must not do) · tRPC routes (Procedure | Type | Auth | Description) · key Zod schemas · owned DB tables · dependencies · a usage snippet.
