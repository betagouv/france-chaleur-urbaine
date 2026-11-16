# demands module

Connection requests ("demandes de raccordement") lifecycle: creation, enrichment, admin validation, processing by gestionnaires, reassignment, reminders and satisfaction loop.

> Business documentation (French, product-team audience, kept up to date): `/admin/doc/cycle-de-vie-demande`, `/admin/doc/relances-notifications`, `/admin/doc/reaffectation-demandes`, `/admin/doc/gestion-reseaux` (network tracking) — sources in `src/modules/doc/content/`. Update them in the same PR as any behavior change here.

## Structure

- `constants.ts` — Zod schemas (creation, gestionnaire/admin update values), `demandStatuses` display order, survey `referrers`.
- `server/creation-user.ts` — single demand creation: enrichments (gas consumption, BDNB, territory), auto-assignment to nearest network (eligible OR < 500 m), initial status, confirmation email, `demand_created` event.
- `server/creation-transfer.ts` — creates a validated classic demand, its address point and audit inside the CCRT moderation transaction; shares only classic contact/building fields, the user comment and any explicit FCU message to the manager (labelled in the shared comment), sends no public confirmation. Private accompaniment comments remain in the source. Manager notifications follow the existing cron.
- `server/creation-batch.ts` — batch creation from pro eligibility tests (max 50 addresses, contact from user profile, admin can provide a dedicated contact).
- `server/admin-operations.ts` — validation gate (`validated`), admin update (`comment_fcu`, relance flags), soft delete, direct assignment change, reject assignment request, recalculate eligibility.
- `server/gestionnaire-operations.ts` — permission-filtered list (with PII anonymization for impersonation), responsible-only update (Status, comment, surface/conso/logements), assignment change request/cancel.
- `server/manager-notifications.ts` — crons: new demands notification + pending demands reminder (network permissions only, driven by `users.preferences.notifications`: `new_demands` = `daily` | `weekly` (Monday digest: not-yet-notified demands + demands notified to a daily colleague since the previous Monday, marking only the former) | `none`, `pending_demands_reminder` boolean — the reminder delay counts from the day the account actually received the demand, i.e. the Monday digest for a weekly account). Tests freeze `Date` with `vi.useFakeTimers({ toFake: ['Date'] })` to pick the weekday.
- `server/relances.ts` — demandeur satisfaction loop (J+30/J+45), `/satisfaction` token-based responses, post-creation survey.
- `server/email-communication.ts` — gestionnaire → demandeur free-text emails, archived in `demand_emails`.
- `server/account-linking.ts` — links anonymous demands to accounts by email on every login.
- `server/eligibility.ts` — enrichment helpers (territory incl. `custom_territory_ids`, gas consumption, BDNB), network distance and auto-assignment, eligibility recalculation, `resolveDemandAssignment` (assignment columns for a nearest network, see *Key invariants*), `reassignDemandsOfDeletedNetworks` (called by the reseaux module once a network deletion is effective — at the sync, or right away for a never-synced network: recomputes the eligibility of the demands pointing to a missing network from their stored coordinates, clears then auto-assigns them, one system `demand_assignment_changed` event each; also runnable on demand with `pnpm cli reseaux:reassign-orphan-demands [--dry-run]`) and `countNetworkDemands` (deletion dialog).
- `server/helpers.ts` — access control (`ensureUserCanAccessDemand` vs `ensureUserCanProcessDemand`), query builder, anonymization. Both access helpers return the loaded demand; callers must reuse it instead of loading it again. The fields read for the check come from `buildDemandForAccessQuery` (`permissions/server/demand-access.ts`), the single access projection shared with the partner API: extend that query, never rebuild it.
- `server/legacy-values.ts` — `legacy_values` JSONB merge helpers.
- `server/network-tracking.ts` — admin network tracking (`/admin/reseaux/suivi`, list of every heat network — existing or under construction, an extension linked to a heat network being tracked with its parent (no line of its own, its detail URL redirects) —, with its managers (network permission only: the accounts notified and reminded), its organization, `demand` reminders and notes — + per-network detail adding the organization's accounts and whether it holds an active partner API credential; it replaced the per-network statistics screen, whose URL `/admin/reseaux/stats` redirects to it): per-demand timeline derived from the `events` audit log at read time (no denormalized column): reception = `demand_validated` or last `demand_assignment_changed`, manager action = `demand_updated` / `demand_email_sent` by a gestionnaire, collectivité or ALEC account (current role) or `api_demand_updated`, response metrics only count demands that awaited a response (acted on, or still pending), status age = last `Status` / `statut` change. Demand events before `DEMAND_HISTORY_START` are unusable (Airtable ids). Thresholds come from `business-rules.ts` (`networkTracking*`). Client in `client/network-tracking/`: a visible column groups several figures, the hidden columns declared after it in `columns.tsx` expose each one to the sort dialog, the filters and the Excel export.

## Purpose & boundaries

- Owns DB tables: `demands`, `demand_emails`.
- State is split between typed columns (`validated`, `network_id`, `network_type`, `extension_id`, `comment_gestionnaire`, `comment_fcu`, `pending_assignment_change`, `deleted_at`) and the `legacy_values` JSONB (Status, Mail/Nom/Prénom, relance and notification flags…). Always merge legacy values with `mergeLegacyValues`, never overwrite the blob.
- Access rules live in `@/modules/permissions` (`isUserResponsibleForDemand`): view = any matching permission; process = network/organization permission (assigned demand) or territory permission (unassigned demand only). Admin is never "responsible" — it has its own operations.
- Connection-demand access counters and the access-holder dialog list gestionnaires, collectivités and ALEC only. The shared `AccessCountsCell` and `AccessDetailDialog` also accept supplied CCRT users from the dedicated accompaniment list, disabling the classic permission query and displaying their last connection. CCRT accounts appear in the dedicated renewable-heat demand access lists, not in these classic-demand views.
- `getUsersWithAccessToDemand` requires the demand type (`heatNetwork` or `renewableHeat`) and filters relevant roles in SQL; callers must not infer the type from a null network assignment.

## tRPC routers (`server/trpc-routes.ts`)

| Router | Auth | Procedures |
| --- | --- | --- |
| `demands.admin.*` | admin | list, update, validate, delete, changeAssignment, rejectAssignmentChangeRequest, recalculateEligibility, listNetworkTracking, getNetworkTracking |
| `demands.gestionnaire.*` | admin + gestionnaire/collectivité/ALEC | list, update, sendEmail, listEmails, requestAssignmentChange, cancelAssignmentChangeRequest, computeNetworkDistance |
| `demands.user.*` | public or authenticated | create (public), createBatch (auth), createFCUTeamContact (public), list (auth), submitSurvey (public), addRelanceComment (public, token-based) |

## Key invariants

- **A demand is never assigned to an extension linked to a heat network** (`zones_et_reseaux_en_construction.reseau_de_chaleur_id` set): the parent network carries it (`network_id` / `network_type = 'reseau_de_chaleur'`), because the same team handles both, and the extension is kept in `extension_id` (FK, `ON DELETE SET NULL`: commissioning leaves the demand on its parent; a CHECK forbids it on anything but a heat network). Permissions, notifications, tracking and access counters therefore keep comparing `network_id` by equality and need no extension logic. Every write of the assignment goes through `resolveDemandAssignment` (`autoAssignNetworkFromEligibility`, `changeDemandAssignment`); `syncLinkedNetworkFields` (reseaux module) moves the demands when a link is created, changed or removed and is the safety net (data diagnostic `extension.not_consolidated`). What the user sees is the **nearest network**: `getNearestNetwork` (`constants.ts`) returns the extension when there is one — use it for display, distances, the reassignment dialog, assignment event snapshots and the partner API output, never `network_id` alone.

- Classic forms and the multi-energy simulator send the shared `zAcquisition` shape through `zCreateDemandInput.acquisition`, stored only in `demands.acquisition`. The old `origin_*`, `mtm_*` and legacy campaign fields are neither accepted nor written for attribution. The admin `Origine` column classifies that snapshot through `analytics/demand-origin.ts`, with a channel filter, evidence popover and export; it does not reconstruct historical attribution. `enrichDemandForGestionnaire` excludes the structured acquisition snapshot; only the admin list exposes the computed origin. Batch creation, admin creation and CCRT transfers set their server creation marker. Creation deduplication preserves the original acquisition; simulator Google events are emitted only after a new demand is confirmed.

- A demand is invisible to gestionnaires/collectivités until an admin validates it; all crons filter on `validated = true` and `deleted_at IS NULL`.
- `'Relance à activer'` is set only at creation (eligible AND collective heating) and drives the satisfaction relances.
- Status transitions are free (no enforced order); admin UI displays Status disabled — status is changed by the responsible role or the partner API.
- Deletion is always soft (`deleted_at`).

- `server/cancel-transfer.ts` withdraws an untouched CCRT transfer inside the moderation transaction, preserving audit and demand data via soft deletion. Manager/API updates commit their audit with the write and reject deleted rows; email records are reserved under the demand lock before SMTP. These paths serialize with transfer cancellation.
