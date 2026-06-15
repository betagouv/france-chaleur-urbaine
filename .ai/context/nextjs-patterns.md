# Next.js Patterns

> **Pages Router** (NOT App Router) — no `src/app/` routing.

- File-based routing: `src/pages/carte.tsx` → `/carte`; dynamic `[id].tsx` / `[...slug].tsx`; special `_app.tsx` / `_document.tsx` / `_error.tsx`.
- `getServerSideProps` for auth/fresh data — wrap protected pages with `withServerSession()` (access session + call services directly). `getStaticProps` + `getStaticPaths` (+ ISR `revalidate`) for content pages (articles, cities). MDX via `createMDX()` in `next.config.ts`.

## Data fetching
- **Client**: tRPC hooks (`trpc.<router>.<procedure>.useQuery()`) — the primary pattern (see api-patterns.md).
- **Never call your own API routes with `fetch()`** — tRPC hooks on the client, services directly on the server.

## API routes (legacy)
REST routes in `src/pages/api/` are legacy. **Don't create new ones — use tRPC.** Exceptions: webhooks, external consumers, file downloads, NextAuth.

## `_app.tsx`
Provider order: `SessionProvider` → tRPC → `NuqsAdapter` → `QueryClientProvider` → `ProgressProvider` → `ThemeProvider` (DSFR). Also boots analytics, auth state, HTML attributes. React Query defaults: retry 1× after 3 s, stale 5 min, no refetch on focus/reconnect.

## Misc
- Heavy client-only components (Map, charts): `next/dynamic` with `ssr: false`.
- `next.config.ts`: ~40 permanent redirects, CSP headers, Sentry, SVGR + raw-markdown + WOFF2 loaders (Turbopack equivalents). User uploads go to external storage, not `public/`.
