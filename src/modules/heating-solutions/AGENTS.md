# heating-solutions module

Static educational articles for validated renewable heating solutions, published under `/ressources/<slug>` and linked from the FCR simulator.

## Structure

- `constants.ts` — validated article metadata and exact simulator-mode mappings. Only solutions marked `Validé` in the source Notion database are published; missing articles have no simulator link.
- `content/*.mdx` — French editorial content copied from the validated Notion properties, with the source URL recorded in metadata. Preserve approved wording and figures; do not silently resolve editorial inconsistencies.
- `content.ts` — static MDX imports for server-rendered, indexable article bodies.
- `client/HeatingSolutionArticle.tsx` — common Figma article layout, section navigation and browser print/PDF action.
- `client/Solution*.tsx` — reusable sections, summary cards, flow diagrams, FAQ and the three comparator calls to action.
- Illustrations live in `public/img/heating-solutions/`. Figma sources: file `t3chbwPeNK6ZulaWs4Rn4S`, web template `3745:19077`, autumn 2026 illustration section `3782:10324`. Existing PAC air/water and solar illustrations remain in use when no replacement was provided.

## Boundaries

No database, API routes, runtime Notion calls or new dependencies. Article content is versioned and rendered at build/request time through the existing resource route. The metadata feeds the first category of the existing article index. The simulator links open in a new tab; the three article CTAs point to `/chaleur-renouvelable`. Homepage tiles are explicitly out of scope.

## Validation

Tests verify article coverage, mappings, assets and the three CTAs. Validate changes with focused tests, TypeScript and Biome; use the browser to check desktop/mobile layouts, SSR content and print output. Update `src/modules/doc/content/chaleur-renouvelable.mdx` and regenerate the documentation search index when publication behavior changes.
