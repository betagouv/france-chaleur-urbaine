# Tech Stack

## Core framework

| Technology | Version | Role |
|-----------|---------|------|
| Next.js | 16.1 | Framework (Pages Router) |
| React | 19.2 | UI library |
| TypeScript | 5.9 | Language (strict mode) |
| Node.js | 24 | Runtime |

## Package manager

- **pnpm 10** (workspaces enabled via `pnpm-workspace.yaml`).
- Always use `pnpm` or `pnpx` for all commands — never `npm`, `npx` or `yarn`.
- Lock file: `pnpm-lock.yaml` (~15K lines). Use `--frozen-lockfile` in CI.

## Database & ORM

| Technology | Version | Role |
|-----------|---------|------|
| PostgreSQL | 16 | Primary database |
| PostGIS | 3.5 | Spatial extension (geometry, geographic queries) |
| Kysely | 0.28 | Type-safe SQL query builder |
| kysely-codegen | 0.19 | Generate TypeScript types from DB schema |
| pg | 8.16 | PostgreSQL client |

Kysely is used instead of Prisma. Types are generated from the actual database schema with `pnpm db:sync`.

## Authentication

- NextAuth.js v4 with credentials provider (email/password).
- JWT-based sessions.
- Roles: `admin`, `gestionnaire`, `collectivite`, `alec`, `professionnel`, `particulier`.

## API layer

| Technology | Version | Role |
|-----------|---------|------|
| tRPC | 11.6 (server + client + react-query) | Type-safe API |
| Zod | 4.1 | Input/output validation |
| TanStack React Query | 5.90 | Server state management + tRPC integration |

## Styling & design system

| Technology | Version | Role |
|-----------|---------|------|
| DSFR | 1.28 (@codegouvfr/react-dsfr) | French government design system (mandatory) |
| Tailwind CSS | 4.1 | Utility-first CSS (`important: true` to override DSFR) |
| styled-components | 6.1 | Legacy CSS-in-JS (do NOT use for new code) |
| Radix UI | various | Primitives (Dialog, Popover, Tooltip) |

## Mapping

| Technology | Version | Role |
|-----------|---------|------|
| MapLibre GL | 5.15 | Map rendering engine |
| react-map-gl | 8.1 | React bindings for MapLibre |
| @mapbox/mapbox-gl-draw | 1.5 | Drawing tools on map |
| @turf/* | 7.3 | GIS computations (buffer, distance, intersect) |
| Tippecanoe | latest | Vector tile generation (runs in Docker) |

## Forms

| Technology | Version | Role |
|-----------|---------|------|
| TanStack React Form | 1.23 | Modern form management (preferred for new code) |
| React Hook Form | 7.x | Legacy form management |
| Zod | 4.1 | Validation schemas (shared client + server) |

## State management

| Technology | Role |
|-----------|------|
| TanStack React Query (via tRPC) | Server state |
| nuqs | URL state (search params) |
| Jotai | Client state (atoms) |
| useState | Local component state |

## Testing

| Technology | Version | Role |
|-----------|---------|------|
| Vitest | 4.0 | Test runner (unit + integration) |
| Testing Library (React + DOM) | 16.3 / 10.4 | Component testing |
| happy-dom | 20.0 | DOM environment for tests |

## Code quality

| Technology | Version | Role |
|-----------|---------|------|
| Biome | 2.3 | Linter + formatter (replaces ESLint + Prettier) |

Biome config: 2-space indent, 140 char line width, LF line endings, single quotes (JS), double quotes (CSS/JSON).

## Infrastructure & deployment

| Service | Role |
|---------|------|
| Scalingo | Hosting (PaaS, buildpacks for GDAL + Tippecanoe) |
| Sentry | Error tracking (sentry.incubateur.net) |
| Matomo | Web analytics (stats.beta.gouv.fr) |
| PostHog | Product analytics |
| Mailpit | Local email testing (port 8025) |
| Docker Compose | Local dev services (PostgreSQL + PostGIS, Mailpit) |

## Business-specific libraries

| Library | Role |
|---------|------|
| @betagouv/france-chaleur-urbaine-publicodes | Heating cost calculation rules |
| publicodes | French rule engine for calculations |
| shapefile | Read .shp geographic files |
| papaparse | CSV parsing |
| xlsx | Excel file processing |
| archiver / jszip | ZIP file creation |
| sharp | Image processing |
| ogr2ogr (GDAL) | Geographic file conversion (Docker) |
| proj4 | Coordinate system transformation |

## Key constraints

- Node.js 24 required (engine constraint in package.json).
- pnpm 10 required.
- Build requires 8GB memory: `NODE_OPTIONS=--max-old-space-size=8192`.
- GDAL and Tippecanoe run in Docker containers locally, via buildpacks on Scalingo.
