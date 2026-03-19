# Next.js Patterns

> This project uses **Pages Router** (NOT App Router). No `src/app/` routing.

## Pages Router structure

- File-based routing: `src/pages/carte.tsx` → `/carte`.
- Dynamic routes: `[id].tsx`, `[...slug].tsx`.
- API routes: `src/pages/api/` (legacy — prefer tRPC for new endpoints).
- Special files: `_app.tsx` (global providers), `_document.tsx` (HTML shell), `_error.tsx`.

## App wrapper (`_app.tsx`)

The `_app.tsx` wraps all pages with these providers (order matters):
1. `SessionProvider` (NextAuth)
2. `TRPCProvider` (tRPC client)
3. `NuqsAdapter` (URL state management)
4. `QueryClientProvider` (React Query)
5. `ProgressProvider` (page transition progress bar)
6. `ThemeProvider` (DSFR theme)

Also initializes: analytics (`useAnalytics()`), auth state (`useInitAuthentication()`), HTML attributes.

React Query defaults:
- Retry: 1 attempt after 3 seconds.
- Stale time: 5 minutes.
- No refetch on window focus or reconnect.

## Data fetching

- **Server-side rendering (SSR):** Use `getServerSideProps` for pages that need auth or fresh data.
- **Client-side:** Use tRPC hooks (`trpc.<router>.<procedure>.useQuery()`). This is the primary pattern.
- **Static:** Use `getStaticProps` + `getStaticPaths` for content pages (articles, cities).
- **Never call your own API routes with `fetch()`** — use tRPC hooks on client, call services directly on server.

```tsx
// Client-side data fetching (preferred)
function NetworksPage() {
  const { data: networks } = trpc.reseaux.getAll.useQuery();
  return <NetworkList networks={networks} />;
}

// Server-side (when needed)
export const getServerSideProps = withServerSession(async ({ session }) => {
  // Access session, call services directly
});
```

## tRPC integration

See [api-patterns.md](api-patterns.md) for tRPC conventions, route structure, and client usage.

## API routes (legacy)

Existing REST routes in `src/pages/api/` are legacy. Rules:
- Do NOT create new REST routes. Use tRPC instead.
- Existing routes: gradually migrate to tRPC in modules.
- Exceptions: webhooks, external API consumers, file downloads, NextAuth.

## Page patterns

- **Route groups:** Not available in Pages Router. Use folder organization instead.
- **Layouts:** Shared layouts via component composition in `_app.tsx` and wrapper components.
- **Auth protection:** Use `withServerSession()` HOC in `getServerSideProps` for protected pages.
- **Error pages:** Custom `_error.tsx` and `404.tsx`.

## Static assets

- Location: `public/` directory.
- Images, fonts, favicon, OpenAPI schema, DSFR icons.
- User-uploaded files go to external storage, not `public/`.

## MDX support

- MDX is enabled via `createMDX()` in `next.config.ts`.
- Used for content pages (resources, articles).
- Raw markdown also loaded via webpack raw-loader.

## Redirects

- 40+ permanent redirects configured in `next.config.ts`.
- Used for page reorganization and URL normalization.
- PostHog analytics tunnel via rewrites.

## Bundle optimization

- Use `next/dynamic` with `ssr: false` for heavy client-only components (Map, charts): avoids SSR errors and reduces server bundle.
- Tree-shake imports: `import { format } from 'date-fns'`, not `import * as dateFns`.
- Keep SVG files small — they are loaded via SVGR as React components.
- Static content pages (`getStaticProps` + `getStaticPaths`) support ISR (`revalidate`) for articles and city pages.

## Configuration highlights (`next.config.ts`)

- Sentry integration (betagouv/fcu-prod).
- Comprehensive CSP (Content Security Policy) headers.
- Custom webpack: SVG/SVGR loaders, raw markdown, WOFF2 fonts.
- Turbopack support with equivalent loaders.
- Asset prefix for GitHub CI static asset serving.
