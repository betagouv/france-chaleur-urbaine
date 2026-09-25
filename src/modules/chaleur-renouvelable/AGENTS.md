# chaleur-renouvelable module

Renewable heating guidance journey: collect building/context inputs, rank heating modes, create either a classic connection demand or a dedicated CCRT accompaniment demand, and expose admin/CCRT follow-up views.

> Product documentation (French, product-team audience): `/admin/doc/chaleur-renouvelable`, with cross-effects documented in `/admin/doc/cycle-de-vie-demande` when this module creates or changes classic connection demands. Update `src/modules/doc/content/*.mdx` and run `pnpm doc:build-search-index` for any behavior change.

## Fast Map

- `constants.ts` — shared domain constants, option lists, Zod schemas, CCRT statuses/project states, `zDemandeChaleurRenouvelable`, `isCcrtExperimentationEligible`.
- `server/trpc-routes.ts` — thin tRPC routing only; business logic stays in `server/service.ts`.
- `server/service.ts` — main server logic: BatEnR lookup, address eligibility context, France Rénov lookup, classic demand creation, CCRT demand creation/list/update.
- `server/altimetry.ts`, `server/france-renov-spaces.ts`, `server/network-eligibility-coordinates.ts` — focused external/geographic helpers with their own tests.
- `client/hooks/useChoixChauffageQueryParams.ts` — URL is the source of truth for simulation/result parameters, including `construction_id` and `originDemandId`.
- `client/simulation-situation.ts` and `client/hooks/useChoixChauffageResults.ts` — convert URL/form state into ranked heating solutions.
- `client/heating-modes/catalog.tsx`, `client/heating-modes/selectors.ts`, `client/heating-mode-rules.ts`, `client/modesChauffageData.ts` — heating mode catalogue, filtering, prerequisites and display data.
- `client/DemandFCRForm.tsx` — public submission form from the result page; sends `zDemandeChaleurRenouvelable`.
- `client/DemandesChaleurRenouvelableAdminPage.tsx` and `client/DemandesChaleurRenouvelableCcrtPage.tsx` — follow-up interfaces.
- Email templates live outside this module: `src/modules/email/templates/demands/ccrt/nouvelle-demande-chaleur-renouvelable.tsx` and `src/modules/email/templates/demands/demandeur/raccordement-non-realisable.tsx`.

## Main Flows

- **Result page state**: query params are parsed/serialized by `useChoixChauffageQueryParams`; avoid adding local state that can drift from the URL.
- **Building selection**: BAN/RNB/BDNB/BatEnR logic is in `getBatEnrBatimentsSelectionContextByBanId`; multiple candidates trigger the client selector.
- **Classic demand**: `createDemandeChaleurRenouvelable` first calls the classic demand path when the heat network is eligible and the user has not selected the public-advisor/refusal path. It reuses `@/modules/demands/server/creation-user` and patches FCR snapshot fields into `legacy_values`.
- **Dedicated CCRT demand**: when no classic demand is created, `createCcrtExperimentationDemand` creates `demands_chaleur_renouvelable` only if the resolved department is in `CCRT_EXPERIMENTATION_DEPARTMENT_CODES` and the housing type is `immeuble_chauffage_collectif`.
- **Refusal follow-up link**: `originDemandId` and `adresse` come from the “Raccordement non réalisable” email URL. On results, `originDemandId` suppresses the heat-network solution from compatible/recommended results, shows it as incompatible with a refusal reason, and bypasses classic demand creation; it is validated against an existing non-deleted `demands` row with status `Non réalisable` and the same email before being stored as `demands_chaleur_renouvelable.origin_demand_id`.
- **CCRT permissions**: CCRT list access is department-based (`user_permissions.type = 'departement'`); admins see all.
- **Admin update**: project state is forced back to `En réflexion` unless status is `[Validation du projet] Etude de faisabilité votée en AG`.

## tRPC Routes

| Procedure | Type | Auth | Notes |
| --- | --- | --- | --- |
| `batEnr.createDemandeChaleurRenouvelable` | mutation | public | Creates either a classic demand, a CCRT demand, or nothing when outside eligible paths. |
| `batEnr.getAddressEligibilityContext` | query | public | Aggregates commune/location, heat/cold network and BatEnR context. |
| `batEnr.getBatEnrBatimentDetails` | query | public | Reads one BatEnR building by construction id. |
| `batEnr.getBatEnrBatimentsByBanId` | query | public | Resolves BAN id to BatEnR candidates. |
| `batEnr.getBatEnrBatimentsSelectionContextByBanId` | query | public | Returns preselected and nearby candidate buildings. |
| `batEnr.getFranceRenovSpace` | query | public | Finds the France Rénov space by address/building. |
| `batEnr.getLocationInfos` | query | public | Reads `communes` metadata by city code/name. |
| `batEnr.admin.listDemandesChaleurRenouvelable` | query | admin | Full admin list. |
| `batEnr.admin.updateDemandeChaleurRenouvelable` | mutation | admin | Status, assignee and project-state follow-up. |
| `batEnr.ccrt.listDemandesChaleurRenouvelable` | query | admin, ccrt | Department-scoped for CCRT users. |

## Data Ownership

- Owns table `demands_chaleur_renouvelable`.
- Reads `communes` to resolve the department for CCRT eligibility; the `geoAddress.context` string is not authoritative for creation.
- Reads `bdnb_batenr`, `bdnb_batiments`, `reseaux_de_chaleur`, `reseaux_de_froid`, `ign_communes`, and France Rénov data for simulation context.
- Creates/patches classic `demands` only through the demands module APIs; never write classic demand legacy blobs directly here except via existing helpers such as `mergeLegacyValues`.

## Tests

- Route/business flow: `pnpm test src/modules/chaleur-renouvelable/server/trpc-routes.integration.spec.ts`.
- URL params: `pnpm test src/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams.spec.ts`.
- Public form submit: `pnpm test src/modules/chaleur-renouvelable/client/DemandFCRForm.spec.tsx`.
- Situation/result logic: `pnpm test src/modules/chaleur-renouvelable/client/simulation-situation.spec.ts src/modules/chaleur-renouvelable/client/modesChauffageData.spec.ts`.
- Server helpers: run the focused `server/*.spec.ts` next to the touched helper.
- CCRT integration tests that create dedicated demands need `seedCcrtExperimentationTerritory()` from `@/tests/fixtures`; otherwise `getLocationInfos` cannot resolve Marseille (`13055`) to department `13`.

## Gotchas

- `cleanDatabase()` clears `ign_*` geography tables and demand tables, but not the static `communes`/`departements` tables; use idempotent seed helpers for those.
- CCRT eligibility depends on the resolved department and `housingType`, not just on an address in PACA-looking text.
- A public-advisor/refusal path with a heat-network-eligible address deliberately bypasses classic demand creation and can create a CCRT demand when the address/building is in the experimentation scope. The same applies to result URLs carrying `originDemandId`.
- `originDemandId` is optional and must be treated as untrusted user input; keep validation server-side and do not lock a classic demand unless the stored link was validated.
- `demands_chaleur_renouvelable.project_state` is meaningful only with the validation status; keep the reset behavior when adding statuses.
- If you add or rename statuses/project states, update `constants.ts`, admin UI assumptions, doc inventories, and tests.
- If you touch a form in this module, load `src/modules/form/AGENTS.md`; `useAppForm` conventions are mandatory for new/edited forms.
- If you touch UI layout or Tailwind classes, load `.ai/context/styling.md` and check responsive text/button behavior.
