## Frontend (React + DSFR)

- Pages Router only (no App Router)
- Design system: `@codegouvfr/react-dsfr` for consistent, accessible UI
- Use wrappers in `@/components/ui/` as a priority
- State:
  - Server state: React Query (legacy, should use trpc for new APIs)
  - Client state: Jotai when needed
  - URL state: `nuqs` (use `useQueryFlag` for booleans)
  - Preferably store state in nuqs when appropriate to allow navigation between pages
  - axios is deprecated and fetch should be used when needed
- Forms: Tanstack React Form + Zod
- Maps: MapLibre components in `src/components/Map/`
  - Custom layers defined in `src/services/Map/map-layers.ts` 

Best practices:
- Typed function components with explicit props
- Never import server code in client files, only shared constants
- Accessibility first: labels, aria-*, focus management
- CSS: Tailwind + DSFR tokens; avoid ad-hoc styles
- Break UI into reusable subcomponents
