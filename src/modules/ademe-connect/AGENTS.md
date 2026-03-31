# ademe-connect

> HTTP client for ADEME's Mulesoft CRM API (CONNECT). Synchronizes FCU user accounts with ADEME's Salesforce CRM via a message queue.

## Structure

```
src/modules/ademe-connect/
  AGENTS.md
  constants.ts    # Mapping UserRole → typeOrganisme (e.g. gestionnaire → "Entreprise")
  commands.ts     # CLI commands (contact:get, contact:create, contacts:bulk-create)
  server/
    client.ts     # Mulesoft HTTP client (createContact, updateContact, getContact)
```

## Purpose and boundaries

**Owns:** HTTP communication with Mulesoft API (`/api/v1/personnes`).

**Must NOT:** contain business logic, know about FCU users or roles — callers handle that mapping.

## API (tRPC routes)

None — this module is a server-side client only. It is called by other modules.

## Env vars

| Var | Description | Default |
|-----|-------------|---------|
| `ADEME_CONNECT_BASE_URL` | Mulesoft base URL | staging URL |
| `ADEME_CONNECT_CLIENT_ID` | Auth client ID | — |
| `ADEME_CONNECT_CLIENT_SECRET` | Auth client secret | — |
| `ADEME_CONNECT_SOURCE` | Source identifier (provided by ADEME CRM team) | — |

## Key behaviors

- Auth: `client_id` + `client_secret` headers on every request.
- Empty/null/undefined fields are stripped before sending (API requirement).
- Fields `ExternalID`, `federationId`, `ancienMail` are never sent.
- Creation and update return a queue acknowledgment, not a direct CRM confirmation.
- Errors are thrown — callers are responsible for fire-and-forget handling.

## Integration points

| Caller | Operation | Trigger |
|--------|-----------|---------|
| `modules/auth/server/service.ts` → `register` | `createContact` | User self-registration |
| `modules/auth/server/service.ts` → `login` | `updateContact` | Login: update `dateConnexion` |
| `modules/users/server/service.ts` → `invite` | `createContact` | Admin creates a user |
| `modules/users/server/trpc-routes.ts` → `updateProfile` | `updateContact` | Profile update: first/last name, phone |
| `modules/users/server/trpc-routes.ts` → `updateNewsletterSubscription` | `updateContact` | Newsletter opt-in/out |
| `modules/users/server/service.ts` → `remove` | `updateContact` | User deletion: set `actif: false` |
| `server/api/users/engie.ts` | `updateContact` | Engie user reactivation (`actif: true`) / deactivation (`actif: false`) |
| `modules/ademe-connect/commands.ts` → CLI | `createContact`, `getContact` | Manual commands / bulk backfill |

All calls are fire-and-forget: errors are logged but not propagated to the caller.

## CLI

Commands registered via `registerAdemeConnectCommands` in the main CLI:

```
pnpm cli ademe-connect contact:get <email>
pnpm cli ademe-connect contact:create <email> [--nom] [--prenom] [--telephone] [--siret] [--type-organisme]
pnpm cli ademe-connect contacts:bulk-create [--dry-run]
```

`contacts:bulk-create`: fetches all valid FCU users with role `particulier`, `professionnel`, or `gestionnaire` and creates them one by one in the ADEME Connect API. Intended for backfilling existing accounts.

## Dependencies

No imports from other FCU modules.
