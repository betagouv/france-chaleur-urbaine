# Architecture & Structure

## High-level architecture

Hybrid architecture: 24 modern modules coexist with legacy code being progressively migrated.

```
Client (Browser)
  → Next.js Pages Router (file-based routing)
    → React Components (DSFR + Tailwind + MapLibre)
      → tRPC Client (type-safe API calls)
        → tRPC Server (modules/*/server/trpc-routes.ts)
          → Service layer (business logic)
            → Kysely (type-safe SQL)
              → PostgreSQL + PostGIS
```

Background: Job queue (PostgreSQL-backed) + Cron scheduler for async tasks (tile generation, bulk eligibility tests, Airtable sync).

## Layers and responsibilities

| Layer | Location | Responsibility | Must NOT |
|-------|----------|---------------|----------|
| Pages | `src/pages/` | URL routing, page composition, SSR/SSG | Contain business logic |
| Components | `src/components/` | UI rendering, user interaction | Call DB or services directly |
| Hooks | `src/hooks/` | Client-side state logic, side effects | Import server code |
| Module client | `src/modules/*/client/` | tRPC hooks, client utilities | Access DB or server internals |
| tRPC routes | `src/modules/*/server/trpc-routes.ts` | Input validation, auth, call services | Contain business logic |
| Services | `src/modules/*/server/*-service.ts` | Business logic, orchestration, authorization | Know about HTTP or tRPC |
| Kysely queries | `src/server/db/kysely/` | Database access, query building | Contain business logic |
| Migrations | `src/server/db/migrations/` | Schema changes | Be edited after application |

## Module system

Each module is a self-contained unit in `src/modules/<name>/`:

```
src/modules/<name>/
  AGENTS.md          # Module documentation (mandatory)
  constants.ts       # Zod schemas, constants, shared config
  types.ts           # Module-specific types
  server/            # Server-only code
    <name>-service.ts
    trpc-routes.ts
  client/            # Client-only code
    hooks.ts
    components/
```

**Import rules:**
- Within a module: use relative imports (`./service`, `../constants`).
- Between modules: use `@/modules/<other>/...`.
- Client code must NEVER import from any `server/` directory.
- Server code must NEVER import from `@/components` or `@/pages`.

**Infrastructure modules:** trpc, auth, jobs, events, notification, security, config, optimization, app.
**Business modules:** reseaux, demands, pro-eligibility-tests, tiles, users, data, email, ban, bdnb, geo, opendata, chaleur-renouvelable, form, analytics, diagnostic.

## Project structure

### Root directory

```
/
├── .ai/                    # AI agent documentation and context files
│   └── context/            # Detailed context files (this directory)
├── .github/workflows/      # GitHub Actions CI/CD
├── docker/                 # Docker configuration files
├── public/                 # Static assets, OpenAPI schema
│   └── openapi-schema.yaml # Public API spec (data.gouv.fr)
├── scripts/                # CLI scripts (@cli/ alias)
├── src/                    # Application source code
├── .env.example            # Environment variables template
├── AGENTS.md               # AI agent root instructions
├── docker-compose.yml      # Local services (PostgreSQL, Mailpit)
├── next.config.ts          # Next.js configuration
├── biome.jsonc             # Biome linter + formatter config
├── tailwind.config.ts      # Tailwind CSS configuration
├── vitest.config.mts       # Vitest test configuration
└── tsconfig.json           # TypeScript configuration
```

### Source directory (`src/`)

```
src/
├── modules/                  # Modern module-based architecture (24 modules)
│   ├── auth/                 # Authentication (NextAuth, sessions)
│   ├── users/                # User CRUD, roles, profiles
│   ├── reseaux/              # Heat/cold network data (core business)
│   ├── demands/              # Connection request management
│   ├── pro-eligibility-tests/# Bulk address eligibility testing
│   ├── tiles/                # Map tile generation (Tippecanoe)
│   ├── trpc/                 # tRPC infrastructure (router, context, middlewares)
│   ├── jobs/                 # Async job processing + cron
│   ├── events/               # Event logging / audit trail
│   ├── email/                # React Email templates
│   ├── form/                 # Form utilities (AddressField, autocomplete)
│   ├── ban/                  # Base Adresse Nationale API
│   ├── bdnb/                 # National building database
│   ├── geo/                  # Geospatial utilities
│   ├── data/                 # Data extraction / summaries
│   ├── analytics/            # Matomo, PostHog config
│   ├── notification/         # Toast / notification system
│   ├── security/             # Rate limiting
│   ├── config/               # Context builders
│   ├── diagnostic/           # System health checks
│   ├── opendata/             # data.gouv.fr integration
│   ├── optimization/         # Build optimization
│   ├── chaleur-renouvelable/ # Renewable heat calculations
│   └── app/                  # App-level utilities (contact form)
│
├── components/               # Shared React components
│   ├── ui/                   # Design system primitives (Box, Card, Hero, Link, etc.)
│   ├── form/                 # Form components
│   │   ├── dsfr/             # DSFR-styled inputs (Input, Select, Checkbox, etc.)
│   │   ├── react-form/       # TanStack Form integration (useForm)
│   │   └── publicodes/       # Publicodes rule engine forms
│   ├── Map/                  # MapLibre GL (layers, tools, legend, style switcher)
│   ├── shared/               # Layout + page wrappers
│   ├── Admin/                # Admin dashboard components
│   ├── Dashboard/            # Professional dashboard
│   ├── EligibilityForm/      # Multi-step eligibility form
│   └── [feature]/            # Feature-specific components
│
├── pages/                    # Next.js Pages Router
│   ├── _app.tsx              # App wrapper (providers, auth, React Query)
│   ├── _document.tsx         # Custom HTML document
│   ├── index.tsx             # Homepage
│   ├── carte.tsx             # Interactive map
│   ├── api/                  # API routes
│   │   ├── trpc/[trpc].ts   # tRPC handler
│   │   ├── auth/[...nextauth].ts # NextAuth handler
│   │   └── [legacy routes]   # Being migrated to tRPC
│   ├── admin/                # Admin pages
│   ├── pro/                  # Professional pages
│   └── ressources/           # Resources / articles
│
├── server/                   # Legacy server code (migrate to modules)
│   ├── db/kysely/            # Kysely connection, types, migrations
│   │   ├── database.ts       # Generated TypeScript schema (99+ tables)
│   │   └── migrations/       # Migration files (YYYYMMDDHHMMSS format)
│   └── services/             # Legacy business logic (migrate to modules)
│
├── services/                 # Legacy client services (migrate to modules)
├── hooks/                    # Custom React hooks
├── types/                    # Shared TypeScript types + enums
├── utils/                    # Utility files
├── config/                   # Configuration (security headers, Sentry)
├── data/                     # Static JSON data (cities, articles)
├── styles/                   # Global styles
└── tests/                    # Test helpers and fixtures
    ├── trpc-helpers.ts       # createTestCaller, testUsers, TestCase utilities
    └── setup-mocks.ts        # Global test mocks
```

## Key files

| File | Purpose |
|------|---------|
| `src/pages/_app.tsx` | Root wrapper: SessionProvider, tRPC, React Query, DSFR theme, analytics |
| `src/modules/trpc/trpc.config.ts` | tRPC router composition (all module routes) |
| `src/modules/trpc/server/context.ts` | tRPC context builder (auth, logger) |
| `src/server/db/kysely/database.ts` | Generated Kysely DB types (99+ tables, single source of truth) |
| `src/server/authentication.ts` | NextAuth configuration |
| `src/pages/api/trpc/[trpc].ts` | tRPC HTTP handler |
| `src/components/Map/Map.tsx` | Main MapLibre GL map component |
| `next.config.ts` | Next.js config (redirects, rewrites, CSP, Sentry, MDX) |
| `public/openapi-schema.yaml` | OpenAPI 3.1 spec for public API |

## File placement rules

| Creating... | Put it in... |
|------------|-------------|
| New feature | `src/modules/<feature>/` (create module) |
| New page | `src/pages/<route>.tsx` |
| tRPC endpoint | `src/modules/<domain>/server/trpc-routes.ts` |
| Business logic | `src/modules/<domain>/server/<domain>-service.ts` |
| Zod schema | `src/modules/<domain>/constants.ts` |
| Module types | `src/modules/<domain>/types.ts` |
| Shared UI component | `src/components/ui/` |
| Feature component | `src/components/<Feature>/` |
| Form component | `src/components/form/` |
| Map layer | `src/components/Map/layers/` |
| Custom hook | `src/hooks/use<Name>.ts` |
| Shared type | `src/types/` |
| Utility function | `src/utils/<name>.ts` |
| Unit test | Next to source: `<name>.spec.ts` |
| Integration test | Next to source: `<name>.integration.spec.ts` |
| DB migration | `src/server/db/migrations/YYYYMMDDHHMMSS_description.ts` |
| Email template | `src/modules/email/` |

## Legacy code (migration in progress)

Remaining legacy code in `src/server/services/` (~13 files) and `src/services/` (2 files).

| File | Purpose | Target module |
|------|---------|---------------|
| `addresseInformation.ts` | Address information lookups | `geo` or `ban` |
| `airtable.ts` | Airtable CRM sync | `demands` or dedicated module |
| `api-adresse.ts` | BAN API client | `ban` |
| `communeAPotentiel.ts` | Commune potential analysis | `reseaux` |
| `emailTemplates.ts` | Legacy email templates | `email` |
| `export.ts` / `export.config.ts` | Data export | dedicated module |
| `manager.ts` | Manager/gestionnaire logic | `reseaux` or `users` |
| `matomo.ts` / `matomo_types.ts` | Matomo analytics | `analytics` |
| `pdp.ts` | PDP utilities | `reseaux` |
| `upload.ts` | File upload | dedicated module |
| `comparateur/` | Comparateur service | dedicated module |

Legacy client services (`src/services/`): `airtable.ts`, `eligibility.ts`, `api/` (legacy API helpers).

**Rule:** When touching legacy code, consider migrating it to a module. New features always go in modules.

## Key architectural decisions

- **Pages Router, not App Router** → Stable, well-tested, full DSFR compatibility. No plans to migrate.
- **Kysely over Prisma** → Full control over SQL, PostGIS support, generated types from actual schema.
- **tRPC over REST** → End-to-end type safety, automatic client generation. Legacy REST routes are not to be extended.
- **Module-based over MVC** → Each domain is self-contained. Easier to reason about, test, and migrate.
- **PostgreSQL-backed job queue over Redis** → Simpler infrastructure, transactional consistency with business data.
- **DSFR as design system** → Government mandate. Tailwind used on top with `important: true` to override DSFR when needed.
- **styled-components deprecated** → Existing uses are legacy. All new styling uses Tailwind.

## Dependency flow

```
Pages → Components → Hooks
          ↓              ↓
     Module Client → tRPC Client
                         ↓
                    tRPC Server → Services → Kysely → PostgreSQL
                                     ↓
                                Types/Utils (shared, any layer)
```

No reverse imports. Server code never reaches client bundles.

## Module AGENTS.md template

When creating a new module, add an `AGENTS.md` with this structure:

```markdown
# {Module Name}

> One-line description of what this module does.

## Structure
<!-- File tree of the module -->

## Purpose and boundaries
<!-- What this module owns. What it must NOT do. -->

## API (tRPC routes)
<!-- Table: Procedure | Type | Auth | Description -->

## Zod schemas
<!-- List key schemas from constants.ts -->

## Database tables
<!-- Tables owned by this module -->

## Dependencies
<!-- Imports from other modules -->

## Usage examples
<!-- Code snippet showing tRPC hook usage from a component -->
```
