# Module: custom-territories

Admin-defined territories that do not follow administrative boundaries (e.g. "département 64 hors CA Pays Basque"), usable as a permission like a commune or an EPCI.

## Structure

- `constants.ts` — Zod schemas: `zTerritoryRef` (one administrative territory: commune / EPCI / EPT / département / région, same codes as the territory permissions), `zCustomTerritoryRecipe` (`include` minus `exclude`), create / update inputs.
- `types.ts` — `CustomTerritory` (row), `CustomTerritoryListItem` (admin counters).
- `server/service.ts` — recipe resolution (`computeRecipeCommuneCodes`, `previewRecipe`, `previewRecipeGeometry`), denormalization on the demands (`resolveCustomTerritoryIds`, `syncDemandCustomTerritoryIds`), full refresh (`refreshCustomTerritories`), detections used by the data diagnostic (`findStaleCustomTerritories`, `findCustomTerritoriesWithOrphanRefs`), CRUD with events.
- `server/trpc-routes.ts` — `customTerritories.admin.*` (admin only).
- `client/admin/AdminCustomTerritoriesPage.tsx` (`/admin/territoires`), `client/CustomTerritoryForm.tsx` (name + two `TerritoryRefsInput` + `RecipePreview` for the commune count + `RecipeMapPreview` for the map).

## How it works

- A **recipe** is a list of included administrative territories and a list of excluded ones. It is resolved against `ign_communes` (`siren_epci` split on `/` for the Grand Paris `EPCI/EPT` encoding, `ept.membres` for EPT) into a materialized `commune_codes text[]` on `custom_territories`. The recipe is the source of truth and `commune_codes` only its materialization: it is resolved again on every update of the territory and by the full refresh, never edited directly. The recipe also gives the admin screen a readable summary.
- Each demands table (`demands`, `demands_chaleur_renouvelable`) carries `custom_territory_ids uuid[]` (GIN index): the ids of the territories whose `commune_codes` contain the demand's `commune_code`. It is written at demand creation / correction (`syncDemandCustomTerritoryIds` from `demands/server/eligibility.ts`, `resolveCustomTerritoryIds` from `chaleur-renouvelable/server/ccrt-access.ts#getCcrtTerritory`) and fully recomputed inside the transaction of every create / update / delete. Only rows whose array actually changes are rewritten (`is distinct from`).
- **After a referential update** (IGN communes / EPCI, EPT import — done outside the app, nothing triggers it automatically), run the full refresh `refreshCustomTerritories` from the CLI: `pnpm cli custom-territories:refresh` (CLI only, deliberately no admin button: it belongs to the referential update procedure). In one transaction it resolves every recipe again into `commune_codes`, then realigns the demands. Without it a territory keeps the communes of the previous referential; the data diagnostic reports it (`custom_territory.stale_communes`, built on `findStaleCustomTerritories`, the same definition of "stale" as the refresh).
- **Orphan recipe reference**: a referential update can also leave a recipe pointing to a territory that matches no commune anymore (absorbed commune, dissolved EPCI / EPT). The refresh cannot see it — the stored communes match the amputated recipe — and the effect is silent: a lost inclusion shrinks the territory, a lost exclusion widens it. The data diagnostic reports it (`custom_territory.orphan_recipe_ref`, built on `findCustomTerritoriesWithOrphanRefs`); the fix is to edit the recipe in the admin screen. A demand keeps the `commune_code` of its creation: if that code left the referential (merged commune), the demand no longer belongs to any custom territory after a refresh or an edit.
- The permission type `custom_territory` (`resource_id` = `custom_territories.id`) is matched by the permissions module against that array — see `permissions/server/demand-access.ts` (`customTerritoryIdsContain` for list filters, index-friendly `@> ARRAY[id]::uuid[]`; `permissionMatchesCustomTerritoryIds` for joins on `user_permissions`, `resource_id = ANY(ids::text[])` — never cast `resource_id` to uuid, Postgres does not short-circuit the `OR` over the other permission types). Semantics are those of a territory permission, and the role still decides which workspace it opens: for heat-network roles (collectivité / ALEC) on `demands`, triage on unassigned demands and read-only on assigned ones; for CCRT on `demands_chaleur_renouvelable` only, through `applyCcrtAccessFilter` and the CCRT notifications (SQL only, there is no in-memory matcher on that side). A CCRT holding a matching custom territory gets no connection demand, and conversely.
- Deleting a territory first removes the permission from every holder (`removePermissionFromAllUsers`, no FK on `user_permissions.resource_id`), then refreshes the demands.
- **Map preview**: `epci` / `ept` carry no geometry, so every outline is built from `ign_communes.geom`. The communes form a polygon coverage (checked: no invalid edge), merged with `ST_CoverageUnion` — about 8 times faster than `ST_Union` (1.6 s vs 13 s for a region), same result — then simplified to ~100 m. Do not use `geom_150m` (the commune shrunk by 150 m: the communes no longer touch, nothing merges). The map reuses the look of the profile permissions map (`permissions/client/PermissionsMap`).

## Boundaries

- Owns `custom_territories` and the `custom_territory_ids` columns of the demands tables. Never reads `user_permissions` for the current user (impersonation): access checks stay in `permissions`.
- Depends on `permissions` (types, cleanup), `events`. `permissions/server/search.ts` and `map-data.ts` query `custom_territories` directly (labels, name search, geometries) to avoid an import cycle.

## tRPC routes

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `customTerritories.admin.list` | query | admin | Territories with communes / permission-holder counters |
| `customTerritories.admin.get` | query | admin | One territory |
| `customTerritories.admin.previewRecipe` | query | admin | Commune count by département for a recipe, nothing saved |
| `customTerritories.admin.previewRecipeGeometry` | query | admin | Map outlines of a recipe (territory, excluded territories, bounds), nothing saved |
| `customTerritories.admin.create` / `update` | mutation | admin | Resolves the recipe (refuses an empty one), saves, refreshes the demands, event `custom_territory_created` / `_updated` |
| `customTerritories.admin.delete` | mutation | admin | Removes the permission from every user, deletes, refreshes, event `custom_territory_deleted` |
| `permissions.searchCustomTerritories` | query | admin | Name search for the permission autocomplete |

## Usage

```ts
import { resolveCustomTerritoryIds } from '@/modules/custom-territories/server/service';

const custom_territory_ids = await resolveCustomTerritoryIds(communeCode); // to store alongside commune_code on a demand
```
