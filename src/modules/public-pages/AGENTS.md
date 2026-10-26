# public-pages module

Public showcase pages: the home page and the renewable heating landing page, built from shared editorial sections.

## Structure

- `constants.ts` — static content: benefits, steps, FAQ, testimonials, tool tiles (`TOOL_TABS`), analytics sources.
- `client/PublicPageContext.tsx` — `PublicPageProvider` / `usePublicPage()`: the analytics `source` (`home` | `fcr_landing`) that prefixes the PostHog events of the shared sections, and the behaviour of the "Comparer les solutions" CTA (scroll to top by default).
- `client/PublicPageSections.tsx` — the six editorial sections in their reference order; rendered by both pages.
- `client/sections/*` — one section per file (benefits, solutions illustration, steps timeline, resources carousel, FAQ, testimonials). Each accepts a `variant` from `@/components/ui/Section` to alternate backgrounds.
- `client/ui/*` — `SectionIntro` (eyebrow + title + lede), `CardFrame`, `CardImage`, `CompareSolutionsButton`.
- `client/resources.ts` — articles of the resources carousel, read from the legacy `@/components/Ressources/config`.
- `client/ToolsTabsSection.tsx` — "Tous vos outils sont ici": tool tiles switchable between the heat-network tab and the all-renewables tab.
- `client/ChaleurRenouvelablePage.tsx` — `/chaleur-renouvelable`: simulator banner + shared sections + scroll depth tracking.

## Boundaries

- Client-only module, no server code, no DB.
- Depends on `chaleur-renouvelable` (simulator form, constants), `form`, `analytics`, and the UI primitives in `@/components/ui`.
- PostHog events emitted by shared sections must exist for every `PublicPageSource` prefix (`home:*` and `fcr_landing:*` in `posthog.config.ts`); the section builds the key from the context source.
