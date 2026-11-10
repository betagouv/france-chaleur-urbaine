# heating-solutions module

Static educational articles for validated renewable heating solutions, published under `/ressources/<slug>` and linked from the FCR simulator.

## Structure

- `constants.ts` — validated article metadata and exact simulator-mode mappings. Only solutions marked `Validé` in the source Notion database are published; missing articles have no simulator link.
- `content/*Article.tsx` — French editorial content copied from the validated Notion properties, with the source URL recorded in metadata. Preserve approved wording and figures; do not silently resolve editorial inconsistencies.
- `content.ts` — static named TSX component imports for server-rendered, indexable article bodies.
- Fifteen validated articles are published, including the heat network, collective geothermal heat pump and individual thermodynamic water heater. All three thermodynamic-water-heater catalogue IDs describe individual hot-water production, including the one grouped under collective heating.
- `client/HeatingSolutionArticle.tsx` — common Figma article layout, section navigation and browser print/PDF action.
- `article-sections.ts` — shared section titles and Figma pictograms for headings and quick links. The cost and funding heading is shared; funding keeps its `aides` anchor as a subheading. `buildingLabel` in article metadata adapts the suitability heading to an apartment building, house or dwelling through `SolutionBuildingContext`. Summary-card labels and pictograms belong to `SolutionSummaryCard`, never to individual article files. The colorful emoji pictograms explicitly requested from this Figma template are a scoped exception to the usual DSFR/Remix icon convention.
- `client/Solution*.tsx` — reusable sections, summary cards, flow diagrams, FAQ and the three comparator calls to action. `SolutionPictogram` enforces color-emoji font fallback for the template pictograms. `SolutionFlow` takes explicit step labels and optional descriptions to preserve their distinct font weights.
- `client/SolutionResourceCard.tsx` — explicit further-reading cards in TSX, with pictogram headings and optional primary/secondary actions. Articles with only one approved resource block retain one card.
- `client/SolutionSteps.tsx` — one ordered list per article, with continuous visible numbering and optional descriptions. `SolutionFundingList` and `SolutionFundingCard` own funding layout and pictograms; neither depends on the surrounding section context.
- The heat-network article embeds the existing `/iframe/form` address test, hidden when printing. The recommended heat-network card also links to its article.
- Illustrations live in `public/img/heating-solutions/`. Figma sources: file `t3chbwPeNK6ZulaWs4Rn4S`, web template `3745:19077`, autumn 2026 illustration section `3782:10324`. The eleven autumn illustrations include four page-level frames outside the section hierarchy: collective air/water (`3783:1120`), solar thermal (`3783:1373`), thermodynamic water heater (`3783:920`) and solar atmospheric heat pump (`3783:951`). Individual air/water modes keep their existing illustration.

## Boundaries

No database, API routes, runtime Notion calls or new dependencies. Article content is versioned and rendered at build/request time through the existing resource route. The metadata feeds the first category of the existing article index. The simulator links open in a new tab; the three article CTAs point to `/chaleur-renouvelable`. Homepage tiles are explicitly out of scope.

## Validation

Tests verify article coverage, mappings, assets and the three CTAs. Validate changes with focused tests, TypeScript and Biome; use the browser to check desktop/mobile layouts, SSR content and print output. Update `src/modules/doc/content/chaleur-renouvelable.mdx` and regenerate the documentation search index when publication behavior changes.
