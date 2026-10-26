# public-pages module

Public showcase pages: the home page and the renewable heating landing page, built from shared editorial sections.

## Structure

- `constants.ts` — static content: benefits, steps, FAQ, testimonials, tool tiles (`TOOL_TABS`), analytics sources.
- `client/PublicPageContext.tsx` — `PublicPageProvider` / `usePublicPage()`: the analytics `source` (`home` | `fcr_landing`) that prefixes the PostHog events of the shared sections, and the behaviour of the "Comparer les solutions" CTA (scroll to top by default).
- `client/PublicPageSections.tsx` — the six editorial sections in their reference order; rendered by both pages.
- `client/sections/*` — one section per file (benefits, solutions illustration, steps timeline, resources carousel, FAQ, testimonials). Each accepts a `variant` from `@/components/ui/Section` to alternate backgrounds.
- `client/ui/*` — `SectionIntro` (eyebrow + title + lede), `CardFrame`, `CardImage`, `CompareSolutionsButton`.
- `client/resources.ts` — articles of the resources carousel, read from the legacy `@/components/Ressources/config`.
- `client/HomePage.tsx` — `/`: `HomeHero` (full-bleed photo + `HomeHeroForm`), `ToolsTabsSection`, shared sections. Its "Comparer les solutions" CTA sets `?mode=comparateur` and scrolls to the top.
- `client/HomeHeroForm.tsx` + `client/home-form.ts` — address test form (`useAppForm`, discriminated union on `mode`): `raccordement` runs the heat network eligibility test and opens the contact modal (`hooks/useEligibilityTest.ts`, `EligibilityContactModal.tsx`, same flow as the legacy `HeadSliceForm`); `comparateur` pushes to `/chaleur-renouvelable/resultat` with the URL built from `choixChauffageQueryParsers`. `?mode=` (nuqs) is the source of truth of the selected mode; the form store mirrors it (a bound radio would echo the programmatic set back into the URL and clear it on load).
- Partner iframe hand-off (`/?address=<label>&heating=collectif|individuel`, see `src/components/IFrame/Form/Eligibility.tsx`) is preserved: params are stored in the `user-info` local storage, the BAN feature is rebuilt from the label (`hooks/useRestoreGeoAddress.ts`) and the eligibility test auto-submits. `heating` ↔ `typeLogement` mapping lives in `home-form.ts` (a house maps to `individuel`).
- `client/ToolsTabsSection.tsx` — "Tous vos outils sont ici": tool tiles switchable between the heat-network tab and the all-renewables tab.
- `client/ChaleurRenouvelablePage.tsx` — `/chaleur-renouvelable`: simulator banner + shared sections + scroll depth tracking.

## Boundaries

- Client-only module, no server code, no DB.
- Depends on `chaleur-renouvelable` (simulator form, constants), `form`, `analytics`, and the UI primitives in `@/components/ui`.
- PostHog events emitted by shared sections must exist for every `PublicPageSource` prefix (`home:*` and `fcr_landing:*` in `posthog.config.ts`); the section builds the key from the context source.
