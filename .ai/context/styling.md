# Styling

## Styling approach

- **Primary**: DSFR (Système de Design de l'État Français) via `@codegouvfr/react-dsfr`.
- **Secondary**: Tailwind CSS 4 with `important: true` (overrides DSFR when needed).
- **Legacy**: styled-components 6 — do NOT use for new code.
- **Never use**: inline `style={}` props, CSS-in-JS (new), global CSS for component styles.
- **Never use**: the `Box` component (legacy) — use Tailwind classes instead.

## DSFR (French government design system)

Mandatory for all government platforms. Provides:
- Pre-built React components (buttons, inputs, alerts, badges, modals, tabs, etc.).
- French accessibility standards (RGAA).
- Consistent look across government sites.

Import DSFR components from `@codegouvfr/react-dsfr`:
```tsx
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
```

Custom UI components in `src/components/ui/` wrap or extend DSFR.

## Tailwind CSS

Config: `tailwind.config.ts` — extends DSFR tokens.

```ts
// tailwind.config.ts highlights
{
  important: true,           // Override DSFR styles
  content: './src/**/*.{js,ts,jsx,tsx,mdx}',
  theme: {
    extend: {
      screens: { xs: '320px', sm: '576px', md: '768px', lg: '992px', xl: '1200px' },
      // Colors from tailwind.colors.mjs (DSFR-compatible palette)
      // Spacing from DSFR tokens
    }
  }
}
```

Use `cx()` utility for conditional classes:
```tsx
import cx from '@/utils/cx'
<div className={cn('base-classes', isActive && 'active-classes', className)} />
```

PostCSS config excludes DSFR from `postcss-import` to prevent build breakage.

## Component styling patterns

1. **Use DSFR components** for standard UI (buttons, forms, alerts).
2. **Use Tailwind** for layout, spacing, custom styling.
3. **Use `cx()`** to merge Tailwind classes conditionally.
4. **Accept `className` prop** on reusable components.
5. **Avoid `@apply`** in CSS files.

```tsx
// Good: DSFR component + Tailwind layout
function NetworkCard({ network, className }: Props) {
  return (
    <div className={cx('p-4 rounded border', className)}>
      <Badge severity="success">{network.status}</Badge>
      <h3 className="mt-2 text-lg font-bold">{network.name}</h3>
    </div>
  );
}
```

## Responsive design

Mobile-first with Tailwind responsive prefixes.

| Breakpoint | Value | Usage |
|-----------|-------|-------|
| Default | < 320px | Base mobile styles |
| `xs` | 320px | Small mobile |
| `sm` | 576px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 992px | Desktop |
| `xl` | 1200px | Wide desktop |

These match DSFR breakpoints (not Tailwind defaults).

## Icons

- DSFR icons: via `@codegouvfr/react-dsfr` icon components, or CSS classes `fr-icon-*`.
- Remix icons: `ri-*` CSS classes (available via DSFR).
- **No emojis in code** — always use DSFR or Remix icons instead.
- Custom SVGs: loaded via SVGR webpack loader (import as React components).

Some DSFR icons need manual copying to `public/icons/`:
```bash
cp node_modules/@gouvfr/dsfr/dist/icons/system/checkbox-circle-line.svg public/icons/system/
```

## Dark mode

- Supported via DSFR theme system (class-based).
- `ThemeProvider` in `_app.tsx`.
- Use DSFR semantic colors — they adapt automatically to dark mode.

## Legacy: styled-components

Files named `*.style.tsx` contain legacy styled-components code. Rules:
- Do NOT create new styled-components.
- When modifying existing styled-components, consider migrating to Tailwind.
- Do NOT use the `Box` component — replace with `div` + Tailwind classes.
