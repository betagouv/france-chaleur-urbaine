## Frontend (React + DSFR)

**Architecture**: Next.js Pages Router (NOT App Router)

## Design System

- **DSFR**: `@codegouvfr/react-dsfr` for French gov standards
- **UI Components**: Use `@/components/ui/*` wrappers (Box, Button, Text, Heading)
- **Icons**: DSFR icons (`fr-icon-*`) or Remix icons via DSFR
- **Colors**: DSFR tokens + FCU custom (`fcu-blue`, `fcu-green`, etc.)

## State Management

- **Server state**: tRPC (via `@tanstack/react-query`) - preferred
- **Client state**: Jotai atoms when needed
- **URL state**: `nuqs` (use `useQueryFlag` for booleans)
- **Prefer URL state** when navigating between pages

## HTTP Client

- **Preferred**: tRPC hooks (`trpc.module.endpoint.useQuery()`)
- **Legacy**: `fetch` API (axios deprecated)

## Forms

See `.ai/context/forms.md` for Tanstack React Form + Zod patterns.

## Maps

See `.ai/context/map.md` for MapLibre integration.

## Best Practices

- **Props**: Explicit extracted types for exported components
- **Imports**: Never import server code in client (use `types.ts` for shared types)
- **Accessibility**: Labels, aria-*, focus management (DSFR handles most)
- **CSS**: Tailwind + DSFR tokens, avoid inline styles
- **Components**: Break into reusable subcomponents
