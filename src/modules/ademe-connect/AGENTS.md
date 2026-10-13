# ademe-connect

> HTTP client for ADEME's Mulesoft CRM API (CONNECT). Synchronizes FCU user accounts with ADEME's Salesforce CRM via a message queue.

## Structure

```
src/modules/ademe-connect/
  AGENTS.md
  constants.ts        # isSyncedRole, UserRole → typeOrganisme, role/structure → rubriques, ALL_FCU_RUBRIQUES
  constants.spec.ts
  commands.ts         # CLI commands (contact:get, contact:create, contacts:bulk-create)
  server/
    client.ts         # Mulesoft HTTP client (createContact, updateContact, getContact)
    client.spec.ts
```

## Purpose and boundaries

**Owns:** HTTP communication with Mulesoft API (`/api/v1/personnes`) and the FCU → CRM vocabulary (`constants.ts`: which roles are synced, `typeOrganisme`, rubriques).

**Must NOT:** read or write FCU users — callers build the payload from their own data and decide when to call.

## API (tRPC routes)

None — this module is a server-side client only. It is called by other modules.

## Env vars

| Var | Description | Default |
|-----|-------------|---------|
| `ADEME_CONNECT_BASE_URL` | Mulesoft base URL | staging URL |
| `ADEME_CONNECT_CLIENT_ID` | Auth client ID | — |
| `ADEME_CONNECT_CLIENT_SECRET` | Auth client secret | — |
| `ADEME_CONNECT_SOURCE` | Source identifier (provided by ADEME CRM team) | `France Chaleur Urbaine` |

Without `CLIENT_ID` + `CLIENT_SECRET`, `createContact` / `updateContact` are no-ops returning `null` (local dev, tests); `getContact` throws.

## Key behaviors

- **Synced roles: every role except `admin`** (`isSyncedRole`). Callers must guard every call with it.
- **The contact key is the email.** An email change is not propagated: admin updates keep targeting the email known before the update (see `users/server/service.ts` → `update`).
- **`actif` is never sent**: deactivation, deletion and retention are not mirrored to the CRM.
- Rubriques: one `FCU - rôle …` per role + one `FCU - structure …` per structure type (`buildRubriques`). `typeOrganisme` is derived from the role (`ROLE_TYPE_ORGANISME`); ALEC and CCRT are sent as `Collectivité`.
- On update, callers send `rubriquesASupprimer: ALL_FCU_RUBRIQUES` together with the new `rubriques` so the contact ends up with exactly the FCU rubriques of its current role/structure (non-FCU rubriques untouched).
- Auth: `client_id` + `client_secret` headers on every request.
- Empty string / null / undefined fields are stripped before sending (API requirement); `false` booleans are kept (`abonnementNewsletter: false`).
- Fields `ExternalID`, `federationId`, `ancienMail` are never sent.
- Creation and update return a queue acknowledgment, not a direct CRM confirmation.
- Errors are thrown — callers are responsible for fire-and-forget handling.

## Integration points

| Caller | Operation | Trigger |
|--------|-----------|---------|
| `modules/auth/server/service.ts` → `register` | `createContact` | Public self-registration (particulier, professionnel) |
| `modules/auth/server/service.ts` → `login` | `updateContact` | Login: update `dateConnexion` |
| `modules/users/server/service.ts` → `create` | `createContact` | Admin or partner API (ENGIE feed) creates a user, any synced role |
| `modules/users/server/service.ts` → `update` | `updateContact` | Admin edits a user: identity, phone, rubriques, newsletter (resync from the stored row, under the previous email) |
| `modules/users/server/trpc-routes.ts` → `updateProfile` | `updateContact` | Profile update: first/last name, phone, rubriques |
| `modules/users/server/trpc-routes.ts` → `updateNewsletterSubscription` | `updateContact` | Newsletter opt-in/out |
| `modules/ademe-connect/commands.ts` → CLI | `createContact`, `getContact` | Manual commands / bulk backfill |

All calls are fire-and-forget: errors are logged but not propagated to the caller.

## CLI

Commands registered via `registerAdemeConnectCommands` in the main CLI:

```
pnpm cli ademe-connect contact:get <email>
pnpm cli ademe-connect contact:create <email> [--nom] [--prenom] [--telephone] [--type-organisme]
pnpm cli ademe-connect contacts:bulk-create [--dry-run] [--role <role>]
```

`contacts:bulk-create`: fetches every valid and active FCU user except admins (optionally one role) and creates them one by one in the ADEME Connect API. Intended for backfilling existing accounts, e.g. after a new role is added to the sync.

## Dependencies

`constants.ts` imports the `UserRole` / `StructureType` types only. `commands.ts` reads the `users` table.
