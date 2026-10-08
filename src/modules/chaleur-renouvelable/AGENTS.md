# chaleur-renouvelable module

Renewable heating guidance journey: collect building/context inputs, rank heating modes, create either a classic connection demand or a dedicated CCRT accompaniment demand, and expose admin/CCRT follow-up views.

> Product documentation (French, product-team audience): `/admin/doc/chaleur-renouvelable`, with cross-effects documented in `/admin/doc/cycle-de-vie-demande` when this module creates or changes classic connection demands. Update `src/modules/doc/content/*.mdx` and run `pnpm doc:build-search-index` for any behavior change.

## Fast Map

- `constants.ts` — shared domain constants, option lists, Zod schemas, CCRT statuses/project states, `zDemandeChaleurRenouvelable`, `isCcrtExperimentationEligible`.
- `server/trpc-routes.ts` — thin tRPC routing only; business logic stays in `server/service.ts` and the focused `server/ccrt-*.ts` services.
- `server/service.ts` — main server logic: BatEnR lookup, address eligibility context, France Rénov lookup, classic demand creation, CCRT demand creation/list/update.
- `server/altimetry.ts`, `server/france-renov-spaces.ts`, `server/network-eligibility-coordinates.ts`, `server/rnic.ts` — focused external/geographic helpers used by `server/service.ts`.
- `client/hooks/useChoixChauffageQueryParams.ts` — URL is the source of truth for simulation/result parameters, including `construction_id` and `originDemandId`.
- `client/simulation-situation.ts` and `client/hooks/useChoixChauffageResults.ts` — convert URL/form state into ranked heating solutions.
- `client/heating-modes/catalog.tsx`, `client/heating-modes/selectors.ts`, `client/heating-mode-rules.ts`, `client/modesChauffageData.ts` — heating mode catalogue, filtering, prerequisites and display data.
- `client/DpeField.tsx` and `client/InputWithSuffix.tsx` — public simulator controls; `CcrtSimulationFields.tsx` reuses the numeric controls in a two-column CCRT grid with a DPE select and inline outdoor-space checkboxes. Refusal details are conditionally shown without clearing hidden values. Building fields remain editable after saving; the returned `updatedAt` renews the optimistic-concurrency token, while dirty drafts retain their original version on background refresh. `average_residents` supports decimals. The sheet has three panels (read-only identification, editable building/heating, declared progress). `ProjectStatusSelect.tsx` owns the public CCRT stage dropdown; `CcrtProjectFields.tsx` displays the original project stages as read-only tags and the original comment as quoted text in the follow-up sheet. `CcrtFollowUpForm.tsx` saves status/project state and an optional note atomically through `updateDemandeChaleurRenouvelable`; history notes are read-only and timeline entries show dates without times; the access-holder list is collapsed by default.
- `client/CcrtHeatingEnergyTag.tsx` — CCRT energy tags use the [dashboard Figma reference](https://www.figma.com/design/t3chbwPeNK6ZulaWs4Rn4S/France-Chaleur-Renouvelable?node-id=3463-18759): gas is mint, oil is yellow, other energies use matching DSFR accents. Preserve the design labels and typography; result rows only display stored solutions, with an explicit empty state and no automatic recalculation.
- `client/DemandFCRForm.tsx` — public submission form from the result page; sends `zDemandeChaleurRenouvelable`.
- `client/DemandesChaleurRenouvelableAdminPage.tsx` and `client/DemandesChaleurRenouvelableCcrtPage.tsx` — follow-up interfaces.
- `client/CcrtDemand*.tsx`, `client/ccrt-workspace.ts` and `client/hooks/useCcrtDemandActions.ts` — CCRT dashboard groups, URL filters, expandable editable building details, shared notes/audit, email composition and shared archiving. `types.ts` derives the client demand/update types from tRPC. Notification links retain the existing `demandes_chaleur_renouvelable_ccrt_search` parameter and open the full list.
- Email templates live outside this module: `src/modules/email/templates/demands/ccrt/nouvelle-demande-chaleur-renouvelable.tsx` and `src/modules/email/templates/demands/demandeur/raccordement-non-realisable.tsx`.

## Main Flows

- **Temporary CCRT collection switch**: `IS_CCRT_DEMAND_ENABLED` in `constants.ts` is currently `false`. Classic connection forms and submissions remain available. The result page skips experimentation eligibility checks and directs all alternative-heating/refusal paths to France Rénov'. The server skips dedicated CCRT creation and its territory checks. Set the shared switch to `true` to restore the preserved experimentation flows; existing demand follow-up remains available.
- **Result page state**: query params are parsed/serialized by `useChoixChauffageQueryParams`; avoid adding local state that can drift from the URL.
- **Building selection**: BAN/RNB/BDNB/BatEnR logic is in `getBatEnrBatimentsSelectionContextByBanId`; multiple candidates trigger the client selector.
- **Classic demand**: `createDemandeChaleurRenouvelable` first calls the classic demand path when the heat network is eligible and the user has not selected the public-advisor/refusal path. It reuses `@/modules/demands/server/creation-user` and patches FCR snapshot fields into `legacy_values`.
- **Dedicated CCRT demand**: when no classic demand is created, `createCcrtExperimentationDemand` creates an unvalidated `demands_chaleur_renouvelable` row only if the resolved department is in `CCRT_EXPERIMENTATION_DEPARTMENT_CODES` and the housing type is `immeuble_chauffage_collectif`. Admin validation publishes it to the CCRT workspace and sends the CCRT notification email.
- **Refusal follow-up link**: `originDemandId` and `adresse` come from the “Raccordement non réalisable” email URL. On results, `originDemandId` suppresses the heat-network solution from compatible/recommended results, shows it as incompatible with a refusal reason, and bypasses classic demand creation; it is validated against an existing non-deleted `demands` row with status `Non réalisable` and the same email before being stored as `demands_chaleur_renouvelable.origin_demand_id`.
- **CCRT permissions**: The list and all actions share `server/ccrt-access.ts`: admin or permission-bearing professional roles with a matching commune/EPCI/EPT/department/region permission; non-admins only see validated demands. Network/organization permissions do not apply because CCRT demands have no assigned network. Active admins are included in the access-holder list. Admins manage permissions using the existing user editor.
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
| `batEnr.admin.validateDemandeChaleurRenouvelable` | mutation | admin | Publishes a dedicated demand to the CCRT workspace and sends the matching CCRT notification email. |
| `batEnr.ccrt.getHeatNetworkEligibility` | query | admin, permission-bearing roles | Reads only heat-network eligibility/distance for the saved building, with the same access check as the demand; never ranks or persists heating solutions. |
| `batEnr.ccrt.listDemandesChaleurRenouvelable` | query | admin, permission-bearing roles | Territorial scopes; validated demands only. |

## Data Ownership

- Owns `demands_chaleur_renouvelable`, `ccrt_demand_notes`, and `ccrt_demand_emails`.
- `server/ccrt-building.ts` recalculates corrections with the shared simulator selectors, refreshes territories and result URL, and uses `updated_at` for optimistic concurrency. Never trust client-provided ranking or territory codes.
- `server/ccrt-notes.ts`, `ccrt-emails.ts`, and `ccrt-follow-up.ts` implement shared notes, idempotent SMTP reservations, and paginated audit. Events use context `ccrt_demand` and the mutation transaction. Successful emails optionally move a still-to-process demand to first contact; failed or pending sends never appear as successful history. A pending reservation after ambiguous SMTP/persistence failure requires manual reconciliation before any retry.
- Closing is a shared status (`Clôturées`), not a per-user flag. Deleted note bodies are removed; audit retains their identifiers.
- `getFollowUp`, `updateBuilding`, `createNote`, `updateNote`, `deleteNote`, `sendEmail`, and `updateDemandeChaleurRenouvelable` recheck demand visibility server-side. Permission audit payloads are filtered to the demand territory to avoid leaking unrelated scopes.
- Reads `communes` to resolve the department for CCRT eligibility; the `geoAddress.context` string is not authoritative for creation.
- Reads `bdnb_batenr`, `bdnb_batiments`, `reseaux_de_chaleur`, `reseaux_de_froid`, `ign_communes`, France Rénov data, and the RNIC data.gouv tabular API for simulation/demand context.
- Creates/patches classic `demands` only through the demands module APIs; never write classic demand legacy blobs directly here except via existing helpers such as `mergeLegacyValues`.

## Tests

- Workspace permissions, notes, emails and correction conflicts: `pnpm test src/modules/chaleur-renouvelable/server/ccrt-workspace.integration.spec.ts`.
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
