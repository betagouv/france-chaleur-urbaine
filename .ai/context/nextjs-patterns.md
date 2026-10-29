# Next.js Patterns

> **Pages Router** (NOT App Router) — no `src/app/` routing.

- File-based routing: `src/pages/carte.tsx` → `/carte`; dynamic `[id].tsx` / `[...slug].tsx`; special `_app.tsx` / `_document.tsx` / `_error.tsx`.
- `getServerSideProps` for auth/fresh data — wrap protected pages with `withServerSession()` (access session + call services directly). `getStaticProps` + `getStaticPaths` for content pages built from files (articles, resources). Pages reading the database (network pages, cities, `/server-sitemap.xml`) use `getServerSideProps` so the build never touches the database. MDX via `createMDX()` in `next.config.ts`.

## Page shell (`SimplePage`)
- Every page renders inside `SimplePage` (`@/components/shared/page/SimplePage`): SEO, header, footer, theme. Props: `title`, `description`, `noIndex`, `mode` (`public` | `public-fullscreen` | `authenticated`, the latter forces `noIndex` and requires a session), `includeFooter`, `currentPage`.
- **Horizontal layout is a `SimplePage` concern, never a wrapper `div`**: `layout="center"` = DSFR container with vertical margins (the usual page), `layout="large"` = wide with side margins, default `fluid` = full width (maps, full-screen tools). Never add your own `<div className="fr-container …">` around the page content — pass `layout` instead.
- Heavy client-only content (publicodes engine, maps, charts) is loaded with `next/dynamic` + `ssr: false`; its `loading` placeholder and any in-component loading state use a visible `<Loader size="xl" variant="section" />` (centered, tall), not the default small `<Loader />`.

## Data fetching
- **Client**: tRPC hooks (`trpc.<router>.<procedure>.useQuery()`) — the primary pattern (see api-patterns.md).
- **Never call your own API routes with `fetch()`** — tRPC hooks on the client, services directly on the server.

## API routes (legacy)
REST routes in `src/pages/api/` are legacy. **Don't create new ones — use tRPC.** Exceptions: webhooks, external consumers, file downloads, NextAuth.

## `_app.tsx`
Provider order: `SessionProvider` → tRPC → `NuqsAdapter` → `QueryClientProvider` → `ProgressProvider` → `ThemeProvider` (DSFR). Also boots analytics, auth state, HTML attributes. React Query defaults: retry 1× after 3 s, stale 5 min, no refetch on focus/reconnect.

## Misc
- Heavy client-only components (Map, charts): `next/dynamic` with `ssr: false`.
- **`router.query` is empty on the first client render** of a statically optimized page (until `router.isReady`), and nuqs's `useQueryState` therefore returns `null` at mount. A component that must read a URL parameter once at mount (restore a state, decode a token) reads `window.location.search` itself, in a client-only component; nuqs stays the way to write.
- `next.config.ts`: ~40 permanent redirects, CSP headers, Sentry, SVGR + raw-markdown + WOFF2 loaders (Turbopack equivalents). User uploads go to external storage, not `public/`.
