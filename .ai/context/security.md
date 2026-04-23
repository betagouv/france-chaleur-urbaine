# Security

## Authentication

- **Library**: NextAuth.js v4.
- **Config**: `src/server/authentication.ts` + `src/pages/api/auth/[...nextauth].ts`.
- **Provider**: Credentials (email/password with bcrypt hashing).
- **Session**: JWT-based (stateless).
- **Session access**:
  - Server (tRPC context): `ctx.user`, `ctx.userId`, `ctx.isAuthenticated`
  - Server (getServerSideProps): `const session = await auth()`
  - Client: `const { data: session } = useSession()` (NextAuth hook)

## Authorization

### User roles

```ts
enum USER_ROLE {
  ADMIN = 'admin',               // Full platform access, can impersonate
  GESTIONNAIRE = 'gestionnaire', // Network operator (manages demands for assigned networks)
  COLLECTIVITE = 'collectivite', // Local authority (manages demands for their territory)
  ALEC = 'alec',                 // Local energy agency (manages demands for their territory)
  PROFESSIONNEL = 'professionnel', // Professional (bulk testing, demand submission)
  PARTICULIER = 'particulier',    // Individual citizen
}

// Admin can impersonate any role from /admin/impostures, optionally toggling PII anonymization
// (stored in the impersonation JWT). See `src/modules/config/server/context-builder.ts`.
```

### Permissions system

Permissions are stored in `user_permissions` table (not in session/JWT). Each permission links a user to a resource.

| Permission type | Roles | resource_id | Demand column matched |
|----------------|-------|-------------|----------------------|
| `reseau_existant` | gestionnaire | FCU network ID (id_fcu) | `demands.network_id` |
| `reseau_en_construction` | gestionnaire | Zone ID | `demands.network_id` |
| `commune` | collectivite, alec | INSEE code | `demands.commune_code` |
| `epci` | collectivite, alec | EPCI code | `demands.epci_code` |
| `ept` | collectivite, alec | EPT code | `demands.ept_code` |
| `departement` | collectivite, alec | Department code | `demands.departement_code` |
| `region` | collectivite, alec | Region code | `demands.region_code` |
| `national` | collectivite, alec | NULL | No filter (all validated) |

**Key module**: `src/modules/permissions/` — types, server service, tRPC routes, client editor.

**Access check flow**:
1. `getUserPermissions(userId)` loads permissions from DB (or `ctx.getPermissions()` for impersonation-aware access).
2. `buildDemandAccessFilter(user, permissions)` returns a Kysely query builder callback for DB-level filtering.
3. `canUserAccessDemand(user, permissions, demand)` checks a single demand in memory.

**Important**: `resource_id` in `user_permissions` is TEXT, but `network_id` in demands is SMALLINT. The service handles conversion at the boundary.

### tRPC authorization (modern)

```ts
// Restrict by role
export const demandsRouter = router({
  getAll: routeRole(['admin', 'gestionnaire']).query(...),
  create: routeRole(['professionnel', 'particulier']).mutation(...),
});

// Custom authorization in service
async function updateDemand(demandId: string, userId: string) {
  const demand = await demandsService.getById(demandId);
  if (!demand) throw new TRPCError({ code: 'NOT_FOUND' });
  // Admin can do anything, gestionnaire only for their networks
  if (!ctx.hasRole('admin') && !isGestionnaireForNetwork(userId, demand.networkId)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}
```

### Legacy API authorization

For routes in `src/pages/api/` that haven't been migrated:
```ts
import { handleRouteErrors } from '@/server/helpers/server';
// Wraps route with auth + error handling
```

### Impersonation

Admin can impersonate any role with custom permissions via `/api/admin/impersonate`. Impersonated permissions are stored in the JWT and passed through `ctx.getPermissions()` instead of loading from DB. This allows testing permission-scoped views without modifying real user data.

### JWT

The JWT only contains the user ID (`sub`). All other user data (role, email, etc.) is loaded fresh from the DB on every session access via `getUserSession()`. This ensures session data is always up-to-date.

### Key rules

- Always check permissions in the **service layer** (not just routes).
- Admin role has full override on all operations.
- Gestionnaires are scoped to their assigned networks via `user_permissions`.
- Collectivités/ALEC are scoped to their territory via `user_permissions`.
- Use `ctx.getPermissions()` (not `getUserPermissions(userId)` directly) to support impersonation.
- Never trust client-side role checks — always enforce server-side.
- Check resource ownership (not just "is logged in").

## Input validation

- Validate ALL external input with Zod (forms, API requests, URL params).
- Validate at the entry point: tRPC route input, not deeper in the stack.
- Zod schemas shared between client (form validation) and server (tRPC input).
- Never trust client-side validation alone.
- Sanitize user-generated content before rendering.

## Environment variables

- `.env.example` — committed, all keys with placeholder values.
- `.env.local` — gitignored, actual development values.
- Server-only: no prefix (`DATABASE_URL`, `NEXTAUTH_SECRET`, `PIPEDRIVE_API_KEY`).
- Client-exposed: `NEXT_PUBLIC_` prefix (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MATOMO_URL`).
- **Never put secrets in `NEXT_PUBLIC_` variables.**
- Validate required env vars at startup.

## Security headers

Configured in `next.config.ts`:
- Content-Security-Policy (comprehensive CSP).
- X-Frame-Options.
- X-Content-Type-Options.
- Referrer-Policy.
- Additional headers via `helmet` middleware.

## Common vulnerability prevention

| Vulnerability | Prevention |
|--------------|-----------|
| XSS | React escapes by default. No `dangerouslySetInnerHTML` without sanitization. |
| SQL injection | Kysely uses parameterized queries. Never concatenate user input into SQL. |
| CSRF | NextAuth CSRF protection. tRPC validates origin. |
| Auth bypass | Role checks in services, not just routes. Verify on every request. |
| Secrets exposure | `.env.local` gitignored. Never log secrets. Never use `NEXT_PUBLIC_` for secrets. |
| Insecure direct object ref | Always verify user owns/has access to the requested resource. |

## Event logging

Security-relevant events are logged via the `events` module:
- Login attempts (success/failure).
- Role changes.
- Demand status changes.
- Admin impersonation.

Log with contextualized logger (include userId, action). **Never log PII** (passwords, tokens, personal data).
