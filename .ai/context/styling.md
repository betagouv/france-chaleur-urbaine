# Styling

## Approach
- **DSFR** (`@codegouvfr/react-dsfr`) for standard UI (buttons, inputs, alerts, modals, tabs…) — mandatory, ships RGAA accessibility. Custom wrappers in `src/components/ui/`.
- **Tailwind 4** (`important: true`, overrides DSFR) for layout / spacing / custom styling.
- **styled-components** (`*.style.tsx`) — legacy, do NOT create new; migrate when touching.
- **Never**: inline `style={}`, new CSS-in-JS, global CSS for component styles, the legacy `Box` component (use `div` + Tailwind), emojis (use icons).

## Tailwind rules
- `cx()` (`@/utils/cx`) **only** for conditional classes; write unconditional class lists as plain strings.
- Don't wrap literal DSFR utility classes in `fr.cx(...)` — write them inline (`'fr-text--xs font-bold'`); keep `fr.cx()` only for variable/typed values.
- Prefer Tailwind text sizes (`text-xs/sm/base/lg`) over DSFR `fr-text--*` (the latter ship a `margin-bottom` that breaks tight layouts — use only for DSFR paragraph rhythm).
- CSS variables in classes (v4 shorthand): `prop-(--my-var)`, not `prop-[var(--my-var)]`.
- Canonical classes: `shrink-0` not `flex-shrink-0`, `grow` not `flex-grow`. No `@apply`. Follow IDE Tailwind diagnostics.
- Reusable components accept a `className` prop.

## Responsive (DSFR breakpoints, not Tailwind defaults)
`xs` 320 · `sm` 576 · `md` 768 · `lg` 992 · `xl` 1200. Mobile-first.

## Icons
DSFR (`fr-icon-*` classes or components) and Remix (`ri-*`). Custom SVGs via SVGR (import as React components). Some DSFR icons must be copied to `public/icons/` manually, e.g. `cp node_modules/@gouvfr/dsfr/dist/icons/system/<name>.svg public/icons/system/`.

## Dark mode
Via the DSFR theme (`ThemeProvider` in `_app.tsx`) — use DSFR semantic colors, they adapt automatically.
