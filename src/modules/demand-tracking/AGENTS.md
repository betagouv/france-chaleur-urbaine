# demand-tracking module

Account-less tracking of demands: a visitor types the email used when submitting a demand and receives the "Où en est votre demande ?" recap (`demands.demandeur.suivi-demande`). Replaces the particulier account whose only feature was the read-only "Mes demandes" page.

> Business documentation (French): `/admin/doc/cycle-de-vie-demande` (section « Suivi par le demandeur »), sources in `src/modules/doc/content/`.

## Structure

- `constants.ts` — `zRequestDemandTrackingInput`, PostHog placements (one per embedding: `homepage`, `page_suivi`), `DEMAND_TRACKING_PAGE_PATH`, `DemandTrackingEmailRow`. The public status wording lives with each demand type: `demandStatusDisplays` / `DEMAND_NOT_VALIDATED_STATUS_DISPLAY` in `demands/constants.ts` (also behind `getDemandeurStatusLabel`, so confirmation screens and « Mes demandes » show the same words), `demandeChaleurRenouvelableStatusDisplays` / `DEMANDE_CHALEUR_RENOUVELABLE_NOT_VALIDATED_STATUS_DISPLAY` in `chaleur-renouvelable/constants.ts`.
- `server/service.ts` — `requestDemandTracking(email)`: lookup in `demands` (by `legacy_values->>'Mail'`, non deleted) and `demands_chaleur_renouvelable` (by `email`), sort (open first, then closed, most recent first), email. Records one `demand_tracking_requested` event per request (`outcome` `sent` / `no_match`, count, types — nothing personal) so the share of requests ending in an email is measurable server-side; a rate-limit block only leaves a server log.
- `server/trpc-routes.ts` — `demandTracking.request` (public mutation, tRPC rate limit `businessRules.demandTrackingEmailsPerHour` per IP per hour).
- `client/DemandTrackingForm.tsx` — email field + button, same info alert whether or not demands match; `TOO_MANY_REQUESTS` is toasted by the tRPC link and the form stays displayed. `client/DemandTrackingCard.tsx` — "Vous avez déjà déposé une demande ?" card (home tools section + hero of `src/pages/suivre-ma-demande.tsx`). `client/DemandTrackingEmailPreview.tsx` — static illustration of the email on the page.

## Purpose & boundaries

- No DB table: nothing about the submitted addresses is stored. The cap is the project's in-memory tRPC rate limiter (per IP, per process); beyond it the mutation fails and the generic error toast is shown.
- Never reveals whether demands exist: no demand → no email, cap reached → no email, same confirmation whether or not demands match.
- Status wording: the public label and explanation come from the tables owned by the demand modules, never from the internal status. A raccordement demand still « À traiter » and not validated by the admin gets the dedicated "not yet forwarded" wording. Multi-ENR statuses outside the product ticket (France Rénov’, études…) are provisional.
- Reads the demand tables of `demands` and `chaleur-renouvelable` directly (read-only); does not write to them.
- Only client analytics (`suivi_demande:form_submitted`); logs carry an email fingerprint (`@/utils/email-fingerprint`), never the address.

## tRPC routes

| Procedure | Type | Auth | Description |
| --- | --- | --- | --- |
| `demandTracking.request` | mutation | public | Sends the recap email when demands match the address; resolves with no payload (`TOO_MANY_REQUESTS` beyond the hourly cap) |

## Entry points wired elsewhere

Home tools section (`public-pages/client/ToolsTabsSection.tsx`), header menu « Ressources et outils » and footer (`SimplePage.tsx`), FAQ, login / registration notice (`components/connexion/ProfessionalAccountNotice.tsx`), failed login and password-reset alerts, demand confirmation panels and emails, the particulier deletion announcement email (`users/commands.ts`).
