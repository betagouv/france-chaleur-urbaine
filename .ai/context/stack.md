# Tech Stack

Versions live in `package.json` (authoritative) — this file captures the choices and rules.

## Core
- **Next.js 16** (Pages Router), **React 19**, **TypeScript 6.0** (strict), **Node 24**.
- **pnpm 10** only — never `npm` / `npx` / `yarn`. CI uses `--frozen-lockfile`. Dependency overrides and `peerDependencyRules` live in `pnpm-workspace.yaml` only, each with a comment naming the advisory or the reason; pnpm ignores the workspace overrides as soon as `package.json` declares `resolutions` / `pnpm.overrides`, so never put them in both.

## Data & API
- **PostgreSQL 16 + PostGIS 3.5**. **Kysely** query builder (not Prisma) — types generated from the live schema via `pnpm db:sync`.
- **tRPC 11** + **Zod 4** (validation, shared client/server) + **TanStack React Query 5** (server state).
- **NextAuth v4**, credentials provider, JWT sessions. Roles: `admin`, `gestionnaire`, `collectivite`, `alec`, `professionnel`, `particulier`.

## UI
- **DSFR** (`@codegouvfr/react-dsfr`) — French government design system, mandatory.
- **Tailwind 4** (`important: true` to override DSFR). **Radix UI** primitives.
- **styled-components** — legacy only, do NOT use for new code.
- **MapLibre GL 6** (ESM-only; worker served from `public/maplibre/`, copied by `scripts/postinstall.mjs`) (+ `@mapbox/mapbox-gl-draw`, `@turf/*`); vector tiles via **Tippecanoe**. See maps.md.

## Forms & client state
- **TanStack React Form** (preferred) — React Hook Form is legacy.
- **nuqs** for URL state, **Jotai** for client atoms, React Query (tRPC) for server state.

## Tooling
- **Biome 2** (lint + format, replaces ESLint/Prettier): 2-space indent, 140 cols, LF, single quotes JS / double quotes CSS+JSON.
- **Vitest 5** + Testing Library + happy-dom.

## Infra
- **Scalingo** (PaaS; buildpacks for GDAL + Tippecanoe). Sentry (errors), Matomo + PostHog (analytics). Local: Docker Compose (Postgres+PostGIS, Mailpit).

## Domain libs
- `@betagouv/france-chaleur-urbaine-publicodes` + `publicodes` (heating cost rules), `shapefile` / `proj4` / `ogr2ogr` (geo), `papaparse` / `xlsx` (imports), `sharp`, `archiver` / `jszip`.

## Constraints
- Node 24 + pnpm 10 (package.json engines). Build needs 8 GB: `NODE_OPTIONS=--max-old-space-size=8192`. GDAL + Tippecanoe run in Docker (buildpacks on Scalingo).
