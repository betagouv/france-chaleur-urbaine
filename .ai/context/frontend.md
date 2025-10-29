## Frontend (React + DSFR)

- Pages Router only (no App Router)
- Design system: `@codegouvfr/react-dsfr` for consistent, accessible UI
- State:
  - Server state: React Query
  - Client state: Jotai
  - URL state: `nuqs` (use `useQueryFlag` for booleans)
- Forms: React Hook Form + Zod
- Maps: MapLibre components in `src/components/Map/`

Best practices:
- Typed function components with explicit props
- Never import server code in client files
- Accessibility first: labels, aria-*, focus management
- CSS: Tailwind + DSFR tokens; avoid ad-hoc styles
- Break UI into reusable subcomponents


