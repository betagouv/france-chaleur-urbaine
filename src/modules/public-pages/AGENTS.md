# public-pages module

Public showcase pages: the home page (`src/pages/index.tsx`) and the renewable heating landing page (`src/pages/chaleur-renouvelable/index.tsx`) compose the sections and forms of this module; the page files stay in `src/pages/` (Next.js), without re-export indirection.

## Structure

- `constants.ts` — static content: benefits, steps, FAQ, testimonials, tool tiles (`TOOL_TABS`), analytics sources.
- `client/PublicPageContext.tsx` — `PublicPageProvider` / `usePublicPage()`: the analytics `source` (`home` | `fcr_landing`) that prefixes the PostHog events of the shared sections, and the behaviour of the "Comparer les solutions" CTA (scroll to top by default).
- `client/PublicPageSections.tsx` — the six editorial sections in their reference order; rendered by both pages.
- `client/sections/*` — one section per file (benefits, solutions illustration, steps timeline, resources carousel, FAQ, testimonials). Each accepts a `variant` from `@/components/ui/Section` to alternate backgrounds and uses the `compact` section size (48px vertical padding on desktop). The home page renders them with `SimplePage` `contentWidth="narrow"` (960px containers); the desktop timeline (step positions + `public/img/chaleur-renouvelable-timeline.svg` wave) is centred for that width.
- `client/ui/*` — `SectionIntro` (eyebrow + title + lede), `CardFrame`, `CardImage`, `CompareSolutionsButton`.
- `client/resources.ts` — articles of the resources carousel, read from the legacy `@/components/Ressources/config`.
- `client/HomeHero.tsx` — full-bleed photo (`public/img/bandeau_accueil.webp`, source WebP q90, derivatives served by the Next image optimizer) + `HomeHeroForm`. The home "Comparer les solutions" CTA sets `?mode=comparateur` and scrolls to the top.
- `client/HomeHeroForm.tsx` + `client/home-form.ts` — address test form (`useAppForm`). `?mode=` (nuqs) is the only source of the selected branch, it is not a form field: it drives the radio, the conditional fields and the schema (`getHomeFormSchema`, two branch schemas unified for TanStack). `raccordement` runs the heat network eligibility test and opens the contact modal (`hooks/useEligibilityTest.ts` over the shared `useContactFormFCU`, `EligibilityContactModal.tsx`); `comparateur` marks the home page as the start of the simulation (`useStartSimulation()` from `simulation-tracking`, see its AGENTS.md) then pushes to `/chaleur-renouvelable/resultat` with the URL built from `choixChauffageQueryParsers`. Initial values are computed synchronously (`hooks/useHomeFormInitialValues.ts`): no effect re-syncs the store after mount.
- Home comparator address validation: only BAN `housenumber` features are accepted in comparator mode. The address field validates immediately on selection and when switching branches; imprecise selections show the dedicated French error below the red address input. Heat-network eligibility mode still accepts streets and municipalities.
- Partner iframe hand-off (`/?address=<label>&heating=collectif|individuel`, see `src/components/IFrame/Form/Eligibility.tsx`) is preserved: the BAN feature is rebuilt from the label once per label (`hooks/useRestoreGeoAddress.ts`), the params are then stored in the `user-info` local storage and the eligibility test auto-submits. `heating` ↔ `typeLogement` mapping lives in `home-form.ts` (a house maps to `individuel`).
- `client/ToolsTabsSection.tsx` — "Tous vos outils sont ici": tool tiles switchable between the heat-network tab and the all-renewables tab.

## Boundaries

- Client-only module, no server code, no DB.
- Depends on `chaleur-renouvelable` (simulator form, constants), `form`, `analytics`, and the UI primitives in `@/components/ui`.
- PostHog events emitted by shared sections must exist for every `PublicPageSource` prefix (`home:*` and `fcr_landing:*` in `posthog.config.ts`); the section builds the key from the context source.
