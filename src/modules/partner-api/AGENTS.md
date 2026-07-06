# partner-api — AI module doc

Authenticated REST API (`/api/v2/demands`) letting a network operator's CRM (Idex, Dalkia…) sync its connection
demands with FCU. Read (polling) + restricted write (`statut`, `commentaire`). One token = one organisation.

> REST carve-out (not tRPC): external machine-to-machine consumer + public OpenAPI. Business access logic is
> **reused** from existing services, not duplicated.

## Structure

```
schema.ts                 # SINGLE SOURCE of the contract (pure zod, client-safe — imported by the public page)
client/ApiGestionnairesPage.tsx  # public doc page (re-exported by src/pages/api-gestionnaires.tsx)
server/authentication.ts  # withPartnerApi: rate-limit → Bearer auth → org context → method dispatch
server/dto.ts             # toDemandDTO (internal row + legacy_values → DemandDTO)
server/handlers.ts        # listDemands, patchDemand
server/legacy/engie-demands.ts     # legacy v1 ENGIE: GET demands route (see "Legacy v1" below)
server/legacy/engie-users.ts       # legacy v1 ENGIE: PUT users route
server/legacy/engie-users-sync.ts  # legacy v1 ENGIE: declarative user sync (shared by the route + the CLI)
server/openapi.ts         # builds the OpenAPI doc (v1 literals + v2 from zod), typed with openapi3-ts/oas31
server/yaml.ts            # generic minimal JSON→YAML emitter (used only by openapi.ts)
server/*.spec.ts          # DTO↔schema conformance, mapper, "yaml is up to date" guard
src/pages/api/v2/demands/{index,[id]}.ts   # thin routes → withPartnerApi
src/pages/api/v1/{demands/[key],users/[key]}.ts  # thin re-exports → server/legacy/*
pnpm cli openapi:generate                  # CLI command → writes public/openapi-schema.yaml from zod
```

> `baseDemandQuery` (handlers.ts) is **exported** and reused by the legacy v1 ENGIE route — see below.

## Single source of truth (no drift)

`schema.ts:zDemande` drives all three surfaces:
- **DTO returned**: `DemandDTO = z.infer<typeof zDemande>` → `toDemandDTO` won't compile if a field is missing.
- **OpenAPI spec**: `z.toJSONSchema(zDemande)` (`server/openapi.ts`). Regenerate with `pnpm cli openapi:generate`;
  `openapi.spec.ts` fails if the committed YAML is stale. **Never hand-edit `public/openapi-schema.yaml`.**
- **Public doc page** `/api-gestionnaires`: its field table is computed from `z.toJSONSchema(zDemande)`.

After any change to `zDemande`/`zPatchDemandBody`/v1 literals, run `pnpm cli openapi:generate`.

## Auth & access scoping

`Authorization: Bearer fcu_…` → `findOrganizationByToken` (organizations module) → synthetic permission
`{ type: 'organization', resource_id: orgId }`. This **reuses** `buildDemandAccessFilter` / `isUserResponsibleForDemand`
unchanged (role `gestionnaire`), so the partner sees/edits exactly the demands of its networks (`validated = true`).
`last_used_at` is touched at most once/minute. Invalid/absent/revoked token → 401.

## Invariants

- `statut` exposes the internal **`DEMANDE_STATUS` label directly** (`À traiter`, `Recontacté pour étude`, …), exactly as
  stored in `legacy_values.Status` — **no key mapping** (`schema.ts:zDemandeStatut` = `z.enum(demandeStatuts)`). ⚠️ Renaming an
  enum label therefore changes the API contract → regenerate the OpenAPI.
- `GET /demands` returns the **full** org-scoped set in one response (no pagination); `updated_since` (inclusive `>=`) drives
  incremental sync — boundary rows may repeat across polls, idempotent via upsert by `id`. Backed by `idx_demands_updated_at`
  (migration `20260625000000`).
- PATCH writes only `legacy_values.Status` + `comment_gestionnaire`; traced in `events` (`author_id: null`, credential in `data`).
- `date_creation` maps to `legacy_values['Date de la demande']` (business date, reliable), falling back to `created_at`
  (import date) only when absent. A future migration will realign `created_at`, then this can revert to `created_at`.

## Legacy v1 (ENGIE — to be decommissioned)

Two single-tenant ENGIE endpoints, kept until its CRM migrates to v2. Logic lives under `server/legacy/`; the
`src/pages/api/v1/...` pages only re-export it (thin, like the v2 routes). **Auth = `authenticatePartner`** (same Bearer →
`organization_api_credentials` lookup as v2); the `[key]` in the URL is ignored. The ENGIE legacy token is imported as an org
credential (same token, hashed), so the org is resolved from the token — no hardcoded `'ENGIE'`.

- **`GET /api/v1/demands/{key}`** (`engie-demands.ts`): resolves the org from the token, then **reuses**
  `baseDemandQuery` + `buildDemandAccessFilter` (org scope) + `toDemandDTO`, reprojected to the flat v1 shape (`address`,
  `buildingType`, `date`, `distance`, `id`, `network`). `network` = affected network SNCU id (`null` for construction / none).
  No pagination.
- **`PUT /api/v1/users/{key}`** (`engie-users.ts` → `engie-users-sync.ts`): declarative user sync called weekly by ENGIE —
  creates/reactivates the feed's gestionnaire accounts (additive `reseau_de_chaleur` permissions resolved by SNCU id,
  `users.from_organization_id` provenance, FK to `organizations`) and deactivates active users absent from the feed. Emits `user_*_by_api` /
  `user_permissions_synced_from_api` events. `syncEngieUsers` is shared with the CLI `debug:upsert-users-from-api`.
