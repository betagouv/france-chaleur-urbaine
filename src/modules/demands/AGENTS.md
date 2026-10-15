# demands module

Connection requests ("demandes de raccordement") lifecycle: creation, enrichment, admin validation, processing by gestionnaires, reassignment, reminders and satisfaction loop.

> Business documentation (French, product-team audience, kept up to date): `/admin/doc/cycle-de-vie-demande`, `/admin/doc/relances-notifications`, `/admin/doc/reaffectation-demandes` — sources in `src/modules/doc/content/`. Update them in the same PR as any behavior change here.

## Structure

- `constants.ts` — Zod schemas (creation, gestionnaire/admin update values), `demandStatuses` display order, survey `referrers`.
- `server/creation-user.ts` — single demand creation: enrichments (gas consumption, BDNB, territory), auto-assignment to nearest network (eligible OR < 500 m), initial status, confirmation email, `demand_created` event.
- `server/creation-batch.ts` — batch creation from pro eligibility tests (max 50 addresses, contact from user profile, admin can provide a dedicated contact).
- `server/admin-operations.ts` — validation gate (`validated`), admin update (`comment_fcu`, relance flags), soft delete, direct assignment change, reject assignment request, recalculate eligibility.
- `server/gestionnaire-operations.ts` — permission-filtered list (with PII anonymization for impersonation), responsible-only update (Status, comment, surface/conso/logements), assignment change request/cancel.
- `server/manager-notifications.ts` — crons: new demands notification + unhandled demands reminder (network permissions only, `receive_new_demands` / `receive_old_demands` flags).
- `server/relances.ts` — demandeur satisfaction loop (J+30/J+45), `/satisfaction` token-based responses, post-creation survey.
- `server/email-communication.ts` — gestionnaire → demandeur free-text emails, archived in `demand_emails`.
- `server/account-linking.ts` — links anonymous demands to accounts by email on every login.
- `server/eligibility.ts` — enrichment helpers (territory, gas consumption, BDNB), network distance and auto-assignment, eligibility recalculation.
- `server/helpers.ts` — access control (`ensureUserCanAccessDemand` vs `ensureUserCanProcessDemand`), query builder, anonymization.
- `server/legacy-values.ts` — `legacy_values` JSONB merge helpers.

## Purpose & boundaries

- Owns DB tables: `demands`, `demand_emails`.
- State is split between typed columns (`validated`, `network_id`, `network_type`, `comment_gestionnaire`, `comment_fcu`, `pending_assignment_change`, `deleted_at`) and the `legacy_values` JSONB (Status, Mail/Nom/Prénom, relance and notification flags…). Always merge legacy values with `mergeLegacyValues`, never overwrite the blob.
- Access rules live in `@/modules/permissions` (`isUserResponsibleForDemand`): view = any matching permission; process = network/organization permission (assigned demand) or territory permission (unassigned demand only). Admin is never "responsible" — it has its own operations.

## tRPC routers (`server/trpc-routes.ts`)

| Router | Auth | Procedures |
| --- | --- | --- |
| `demands.admin.*` | admin | list, update, validate, delete, changeAssignment, rejectAssignmentChangeRequest, recalculateEligibility, getReseauxStats |
| `demands.gestionnaire.*` | admin + gestionnaire/collectivité/ALEC/CCRT | list, update, sendEmail, listEmails, requestAssignmentChange, cancelAssignmentChangeRequest, computeNetworkDistance |
| `demands.user.*` | public or authenticated | create (public), createBatch (auth), createFCUTeamContact (public), list (auth), submitSurvey (public), addRelanceComment (public, token-based) |

## Key invariants

- A demand is invisible to gestionnaires/collectivités until an admin validates it; all crons filter on `validated = true` and `deleted_at IS NULL`.
- `'Relance à activer'` is set only at creation (eligible AND collective heating) and drives the satisfaction relances.
- Status transitions are free (no enforced order); admin UI displays Status disabled — status is changed by the responsible role or the partner API.
- Deletion is always soft (`deleted_at`).
