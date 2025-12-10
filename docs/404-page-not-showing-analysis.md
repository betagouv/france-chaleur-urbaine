# 404 Page Not Showing Analysis

**Subject**: Custom 404 page (`pages/404.tsx`) not working when `app` directory exists alongside `pages` directory

**Solution**: Create `app/not-found.tsx` to handle 404s in the App Router, which takes precedence when `app/` directory exists

## Options Evaluated

### Option 1: Create `app/not-found.tsx` (Recommended)

- **Implementation**: Create a `not-found.tsx` file in `src/app/` that renders the same UI as the current `pages/404.tsx`
- **Pros**:
  - Official Next.js solution for App Router
  - Works immediately without configuration
  - Future-proof for migration to App Router
- **Cons**:
  - Requires maintaining two 404 files during transition (or extracting shared component)
  - App Router `not-found.tsx` needs to import its own layout/styles
- **Code Impact**: New file `src/app/not-found.tsx`, potentially shared component

### Option 2: Remove or Rename `app` Directory

- **Implementation**: Rename `src/app/` to something like `src/app-styles/` or move `globals.css` elsewhere
- **Pros**:
  - Quick fix, no code changes
  - Pages Router 404 will work again immediately
- **Cons**:
  - Blocks any future App Router adoption
  - Must restructure Tailwind CSS imports
  - Hacky workaround, not addressing root cause
- **Code Impact**: Rename directory, update CSS imports

### Option 3: Use `global-not-found.tsx` (Experimental - Next.js 15.4+)

- **Implementation**: Enable `experimental.globalNotFound` in `next.config.ts` and create `app/global-not-found.tsx`
- **Pros**:
  - Handles ALL unmatched routes globally
  - Doesn't depend on layouts
  - Works even with multiple root layouts
- **Cons**:
  - Experimental feature, may change
  - Requires full HTML structure (`<html>`, `<body>`)
  - Must import all global styles/fonts directly
- **Code Impact**: `next.config.ts` + new `src/app/global-not-found.tsx`

### Option 4: Middleware Workaround

- **Implementation**: Add 404 detection in middleware using `NextResponse.rewrite()` or custom logic
- **Pros**:
  - Works without changing file structure
  - Full control over routing
- **Cons**:
  - Complex to implement correctly
  - Performance overhead on every request
  - Maintenance burden
- **Code Impact**: `middleware.ts` modifications

## Technical Analysis

**Current Implementation**:
- `src/pages/404.tsx` - Custom 404 page using `SimplePage` component with DSFR styling
- `src/app/` directory exists with only `globals.css` (Tailwind CSS v4 configuration)
- No `layout.tsx` or `page.tsx` in `app/` directory

**Root Cause** ([GitHub Issue #58945](https://github.com/vercel/next.js/issues/58945)):
When Next.js detects an `app` directory, it assumes App Router is being used and compiles `/not-found` instead of `/404`. The presence of `globals.css` alone is enough to trigger this behavior.

**Dependencies**:
- Next.js version (likely 13.5.4+ based on issue reports)
- Tailwind CSS v4 using `@import` in `app/globals.css`

**Performance Impact**: None for Options 1-3. Option 4 adds middleware overhead.

**Maintainability**: Option 1 is most maintainable long-term as it aligns with Next.js direction.

## Code References

- `src/pages/404.tsx:1-23` - Current 404 implementation
- `src/app/globals.css:1-67` - Only file in app directory (Tailwind CSS)
- `next.config.ts:130-134` - Experimental config location

## Recommended Implementation

**Option 1: Create `app/not-found.tsx`**

```tsx
// src/app/not-found.tsx
import Link from 'next/link';
import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';

export default function NotFound() {
  return (
    <SimplePage title="Page non trouvée : France Chaleur Urbaine">
      <div className="fr-container fr-py-4w fr-mb-16w">
        <Heading size="h3">Page non trouvée</Heading>
        <Text mb="3w">La page que vous recherchez n'existe pas ou a été déplacée.</Text>
        <Link href="/" className="fr-link fr-icon-arrow-left-line fr-link--icon-left">
          Retour à l'accueil
        </Link>
      </div>
    </SimplePage>
  );
}
```

**Note**: This requires `app/layout.tsx` to exist. If using App Router not-found without a layout, use Option 3 instead.

**Alternative - Option 3 for standalone 404**:

```ts
// next.config.ts - add to experimental
experimental: {
  globalNotFound: true,
}
```

```tsx
// src/app/global-not-found.tsx
import './globals.css';

export const metadata = {
  title: 'Page non trouvée : France Chaleur Urbaine',
};

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <div className="fr-container fr-py-4w fr-mb-16w">
          <h1>Page non trouvée</h1>
          <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
          <a href="/" className="fr-link fr-icon-arrow-left-line fr-link--icon-left">
            Retour à l'accueil
          </a>
        </div>
      </body>
    </html>
  );
}
```

## Recommendation Rationale

**Option 1** is recommended because:
1. It's the official Next.js approach for hybrid `app`/`pages` projects
2. Requires minimal changes (one new file)
3. Will work as-is when migrating more pages to App Router
4. No experimental flags needed

If `SimplePage` component has dependencies that don't work in App Router context, **Option 3** provides a cleaner standalone solution.

## Sources

- [Next.js Issue #58945: Custom 404 not working with app directory](https://github.com/vercel/next.js/issues/58945)
- [Next.js not-found.js Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [Next.js App Router Migration Guide](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- [Max Schmitt: Next.js 404 Page with App Router](https://maxschmitt.me/posts/nextjs-404-page-app-router)
