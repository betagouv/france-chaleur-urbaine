# network-change-requests module

Change requests submitted for a network (modification of the public network page, new or updated trace, priority development perimeter, other), stored in the database and reviewed by an admin. Replaces the Airtable tables « FCU - Modifications réseau » and « FCU - Contribution ».

> Product documentation (French): `/admin/doc/modifications-reseau` (`src/modules/doc/content/modifications-reseau.mdx`). Update it and run `pnpm doc:build-search-index` for any behavior change.

## Structure

- `constants.ts` — kinds, statuses, contact types, file roles (labels included), `networkChangeRequestFileRules` (roles / type groups / counts allowed per kind), one zod payload schema per kind, `zCreateNetworkChangeRequestInput` (discriminated union on `kind`), `zAcceptNetworkChangeRequestInput`.
- `server/service.ts` — creation (network existence, file rules, acknowledgement email, event, `parse_request_geometries` job when geo files are attached), admin list (file metadata + geometry conversion status), pending count, review context (current network values for the diff), network linking, acceptance per kind (`fiche`: values written through the reseaux service, documents taken down (`payload.documentsToRemove`, checked at creation against the published ones and the cap) then published, inclusion keys per file from `document-change-keys.ts`; `trace_existant`: geometry applied right away through `applyNetworkGeometryDraft` (tiles rebuilt, eligibility rechecked) + metadata (+ linked PDP); `trace_construction`: construction network created or updated, geometry applied; `pdp`: PDP created and applied; `autre`: nothing). The acceptance emails the publication (`demande-acceptee`) when something was published, for form requests of a kind in `notifiedNetworkChangeRequestKinds`; `renameNetworkChangeRequestFile` renames an attached file of a pending request, `replaceNetworkChangeRequestGeometryFile` swaps the files of a role for an admin GeoJSON.
- `server/geometry-conversion.ts` — `convertGeoFilesToGeometry`: ogr2ogr in a temp dir (zip via `/vsizip/`), features merged by `processGeometry`.
- `server/jobs.ts` — `parse_request_geometries` job: one geometry per role (`trace`, `pdp`) stored in `network_change_request_geometries`, files kept (downloadable until the retention purge), replaced files (`replaced_at`) ignored; fails (replayable) while a file is still waiting for its antivirus scan.
- `server/trpc-routes.ts` — router `networkChangeRequests`.
- `client/AdminNetworkChangeRequestsPage.tsx` — `/admin/modifications-reseau`: table (presets seeded from the URL filters), detail dialog (`?id=` deep link) with `RequestChangesTable` (per-change include / exclude checkboxes, file rename) and `RequestGeometryMap` (before / after), one decision button whose label states the consequence (`NetworkChangeRequestDetail`) and its confirmation dialog; a failed conversion can be replayed from the trace / perimeter row.
- Public forms: `src/pages/reseaux/modifier.tsx` (kind `fiche`) and `src/components/ContributionForm/` (kinds `trace_existant`, `trace_construction`, `pdp`, `autre`; `buildContributionRequest.ts` maps the form to the `create` input); files are uploaded first via `POST /api/files/upload`.
- `client/LinkNetworkField.tsx` — `ReseauAutocomplete` to attach a pending request to a network.
- `client/PendingNetworkChangeRequestsBadge.tsx` — pending counter in the admin menu (`AdminPageMenuLabel`); the admin dashboard indicators (`admin` module) count them too.

## tRPC routes

| Procedure | Type | Auth | Description |
| --- | --- | --- | --- |
| `networkChangeRequests.create` | mutation | public, rate-limited | Creates a request; files are referenced by the ids returned by `POST /api/files/upload` |
| `networkChangeRequests.admin.list` | query | admin | All requests, newest first, with the processing admin (`processed_by_email`), `notified` and file metadata |
| `networkChangeRequests.admin.countPending` | query | admin | Number of `pending` requests |
| `networkChangeRequests.admin.getReviewContext` | query | admin | Current values + documents of the targeted heat/cold network, `null` otherwise |
| `networkChangeRequests.admin.linkNetwork` | mutation | admin | Attaches a pending request to a network of the base (or detaches it) |
| `networkChangeRequests.admin.getRequestGeometry` | query | admin | Converted geometry of a role, for the before / after map |
| `networkChangeRequests.admin.accept` | mutation | admin | Claims the pending request (`BAD_REQUEST` on a concurrent decision), applies it per kind (see service), restricted to the `included` keys when given (payload fields, `document:<id>` / `document-removal:<id>` per file, `trace`, `pdp`; the geometry of a `trace_construction` / `pdp` request is always applied); every geometry and document is validated before the first write; `BAD_REQUEST` when the network link is missing, a geometry is not converted yet or failed, or a document is not scanned yet. PDF-only traces / perimeters are closed without creating anything nor emailing (drawn by hand) |
| `networkChangeRequests.admin.replaceGeometryFile` | mutation | admin | Replaces the files of a role (`trace`, `pdp`) of a pending request by an admin GeoJSON: previous links get `replaced_at`, the geometry is read right away (no job) |
| `networkChangeRequests.admin.renameFile` | mutation | admin | Renames a file of a pending request (same extension) |
| `networkChangeRequests.admin.retryGeometryConversion` | mutation | admin | Replays the `parse_request_geometries` job of a pending request (failed conversions cleared meanwhile) |

## Data model

- Owns `network_change_requests` (one row per request: `kind`, `status`, optional resolved network `network_type` + `network_id`, `network_label` as typed by the submitter, contact columns, kind-specific `payload` jsonb, review columns, optional `user_id` for a logged-in submitter), `network_change_request_files` (file ↔ request with a `role`: `document`, `trace`, `pdp`) and `network_change_request_geometries` (converted WGS84 GeoJSON geometry or conversion error per role).
- Files themselves live in the `files` module. A file can be attached to one request only, and must be unused, not purged and not infected at creation.
- Events: `network_change_request_created` / `_processed`, `context_type = 'network_change_request'`. There is no refusal: a request is applied, or closed without change (`included: []`).
- Emails: `reseaux.demandeur.accuse-reception` (at creation, fiche or contribution wording by kind), `reseaux.demandeur.demande-acceptee` (at acceptance when something is published). No team email: admins are notified by the menu badge and the dashboard.

## Status of the migration

- Both public forms write here; the Airtable tables « FCU - Modifications réseau » and « FCU - Contribution » are no longer fed (kept as read-only archives). Retention: `processed_network_change_requests` rule (retention module).
- Later: the same forms from the gestionnaire space (set `user_id`, restrict the network to the user's permissions).
