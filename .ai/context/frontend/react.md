## Frontend (React + DSFR)

**Architecture**: Next.js Pages Router (NOT App Router) - See `.ai/context/required/architecture.md` for details

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

## Component Patterns

- **Props**: Explicit extracted types for exported components
- **Imports**: Never import server code in client (use `types.ts` for shared types)
- **Components**: Break into reusable subcomponents
- Keep components focused and small

## Styling

- **CSS**: Tailwind + DSFR tokens, avoid inline styles
- Use DSFR design tokens for consistency

## Accessibility

- Labels, aria-*, focus management (DSFR handles most)
- Use semantic HTML

## Forms

See `.ai/context/frontend/forms.md` for Tanstack React Form + Zod patterns.

## Maps

See `.ai/context/frontend/maps.md` for MapLibre integration.
