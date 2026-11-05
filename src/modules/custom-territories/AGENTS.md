# Module: custom-territories

Admin-defined territories that do not follow administrative boundaries (e.g. "département 64 hors CA Pays Basque"), usable as a permission like a commune or an EPCI.

## Structure

- `constants.ts` — Zod schemas: `zTerritoryRef` (one administrative territory: commune / EPCI / EPT / département / région, same codes as the territory permissions), `zCustomTerritoryRecipe` (`include` minus `exclude`), create / update inputs.
- `types.ts` — `CustomTerritory` (row), `CustomTerritoryListItem` (admin counters).
- `server/service.ts` — recipe resolution (`computeRecipeCommuneCodes`, `previewRecipe`), denormalization on the demands (`resolveCustomTerritoryIds`, `syncDemandCustomTerritoryIds`, `refreshDemandsCustomTerritoryIds`), CRUD with events.
- `server/trpc-routes.ts` — `customTerritories.admin.*` (admin only).
- `client/admin/AdminCustomTerritoriesPage.tsx` (`/admin/territoires`), `client/CustomTerritoryForm.tsx` (name + two `TerritoryRefsInput` + `RecipePreview`).

## How it works

- A **recipe** is a list of included administrative territories and a list of excluded ones. It is resolved against `ign_communes` (`siren_epci` split on `/` for the Grand Paris `EPCI/EPT` encoding, `ept.membres` for EPT) into a materialized `commune_codes text[]` on `custom_territories`. The recipe is kept so the communes can be recomputed after a referential update, and so the admin screen can display a readable summary.
- Each demands table (`demands`, `demands_chaleur_renouvelable`) carries `custom_territory_ids uuid[]` (GIN index): the ids of the territories whose `commune_codes` contain the demand's `commune_code`. It is written at demand creation / correction (`syncDemandCustomTerritoryIds` from `demands/server/eligibility.ts`, `resolveCustomTerritoryIds` from `chaleur-renouvelable/server/ccrt-access.ts#getCcrtTerritory`) and fully recomputed by `refreshDemandsCustomTerritoryIds` inside the transaction of every create / update / delete, from the admin button « Recalculer les demandes », and from `pnpm cli custom-territories:refresh` (to run after an IGN communes / EPCI import). Only rows whose array actually changes are rewritten (`is distinct from`).
- The permission type `custom_territory` (`resource_id` = `custom_territories.id`) is matched by the permissions module against that array — see `permissions/server/demand-access.ts` (`customTerritoryIdsContain` for list filters, index-friendly `@> ARRAY[id]::uuid[]`; `permissionMatchesCustomTerritoryIds` for joins on `user_permissions`, `resource_id = ANY(ids::text[])` — never cast `resource_id` to uuid, Postgres does not short-circuit the `OR` over the other permission types). Semantics are those of a territory permission: triage on unassigned demands, read-only on assigned ones.
- Deleting a territory first removes the permission from every holder (`removePermissionFromAllUsers`, no FK on `user_permissions.resource_id`), then refreshes the demands.

## Boundaries

- Owns `custom_territories` and the `custom_territory_ids` columns of the demands tables. Never reads `user_permissions` for the current user (impersonation): access checks stay in `permissions`.
- Depends on `permissions` (types, cleanup), `events`. `permissions/server/search.ts` and `map-data.ts` query `custom_territories` directly (labels, name search, geometries) to avoid an import cycle.

## tRPC routes

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `customTerritories.admin.list` | query | admin | Territories with communes / permission-holder counters |
| `customTerritories.admin.get` | query | admin | One territory |
| `customTerritories.admin.previewRecipe` | query | admin | Commune count by département for a recipe, nothing saved |
| `customTerritories.admin.create` / `update` | mutation | admin | Resolves the recipe (refuses an empty one), saves, refreshes the demands, event `custom_territory_created` / `_updated` |
| `customTerritories.admin.delete` | mutation | admin | Removes the permission from every user, deletes, refreshes, event `custom_territory_deleted` |
| `customTerritories.admin.refreshDemands` | mutation | admin | Full recompute of `custom_territory_ids`, returns the rows touched per table |
| `permissions.searchCustomTerritories` | query | admin | Name search for the permission autocomplete |

## Usage

```ts
import { resolveCustomTerritoryIds } from '@/modules/custom-territories/server/service';

const custom_territory_ids = await resolveCustomTerritoryIds(communeCode); // to store alongside commune_code on a demand
```
