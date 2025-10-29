## Stack

**Core**: Next.js 16 (Pages Router), TypeScript 5 (strict)

**UI**: DSFR (`@codegouvfr/react-dsfr`), styled-components 6, Tailwind CSS 4 + PostCSS

**State**: React Query (server), Jotai (client), `nuqs` (URL)

**Maps**: MapLibre GL, Turf.js, `proj4`, `geojson-vt`, `vt-pbf`, `react-map-gl`

**Forms**: Tanstack React Form + Zod 4

**API**: tRPC (`@trpc/*`) preferred, legacy `/api` routes, `axios` deprecated → use `fetch`

**Database**: PostgreSQL + PostGIS, Kysely (ORM), Knex (migrations), `kysely-codegen` (types)

**Auth**: next-auth, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, Sentry

**Testing**: Vitest 3, Testing Library, `happy-dom`

**Quality**: Biome (lint/format), `knip` (dead code), `react-scan`

**Build**: Next build, SVGR, Tailwind/PostCSS, `tsx`, `babel-plugin-react-compiler`

**Utils**: `react-email`, Matomo, Facebook Conversion API, `cron`, `sharp`, `winston`, `dotenv`, `commander`, `uuid`, `dayjs`, `js-cookie`
