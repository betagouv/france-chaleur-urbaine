# Security

## Authentication

- **NextAuth.js v4**, Credentials provider (email/password, bcrypt). JWT-based sessions (stateless).
- Config: `src/server/authentication.ts` + `src/pages/api/auth/[...nextauth].ts`.
- Session access:
  - Server (tRPC): `ctx.user`, `ctx.userId`, `ctx.isAuthenticated`.
  - Server (`getServerSideProps`): `const session = await auth()`.
  - Client: `const { data: session } = useSession()`.
- **JWT only contains the user ID (`sub`).** Role, email, etc. are loaded fresh from the DB on every session access via `getUserSession()` — never stale.

## Authorization

### User roles

```ts
enum USER_ROLE {
  ADMIN = 'admin',                 // Full access, can impersonate
  GESTIONNAIRE = 'gestionnaire',   // Network operator — demands for assigned networks
  COLLECTIVITE = 'collectivite',   // Local authority — demands for their territory
  ALEC = 'alec',                   // Local energy agency — demands for their territory
  PROFESSIONNEL = 'professionnel', // Bulk testing, demand submission
  PARTICULIER = 'particulier',     // Individual citizen
}
```

Admin can impersonate any role from `/admin/impostures`, optionally anonymizing PII (stored in the impersonation JWT). See `src/modules/config/server/context-builder.ts`.

### Permissions system

Stored in the `user_permissions` table (**not** in session/JWT). Each row links a user to a resource. Key module: `src/modules/permissions/` (types, server service, tRPC routes, client editor).

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

Access check flow:
1. `getUserPermissions(userId)` loads from DB — or `ctx.getPermissions()` for impersonation-aware access.
2. `buildDemandAccessFilter(user, permissions)` → Kysely callback for DB-level filtering.
3. `canUserAccessDemand(user, permissions, demand)` → single demand, in memory.
4. `isUserResponsibleForDemand(user, permissions, demand)` → must *process* (narrower than access).

⚠️ `resource_id` is **TEXT**, but `demands.network_id` is **SMALLINT** — the service converts at the boundary.

### Access vs responsibility — two distinct semantics

| Concept | Function | Admin | Match logic |
|---------|----------|-------|-------------|
| **Access** (can view) | `canUserAccessDemand` | always **true** | any matching permission (network OR territory) |
| **Responsibility** (must process) | `isUserResponsibleForDemand` | always **false** | if demand has a network → only matching network perm ; else → any matching territory perm |

Territory holders (collectivité/ALEC) **see** demands in their area but only **process** the unaffected ones (triage). Once a network is affected, only its gestionnaire is responsible.

### Authorization helpers — the `ensure*` pattern

**Never** duplicate `if (ctx.user.role !== 'admin')` before a permission check. Use the centralized helpers in `demands/server/helpers.ts` (encapsulate admin bypass + permission load + `FORBIDDEN` throw):

| Helper | Use when |
|--------|----------|
| `ensureUserCanAccessDemand(ctx, demand)` | demand loaded ; check view access |
| `ensureUserCanAccessDemandById(ctx, demandId)` | only id ; check view access |
| `ensureUserCanProcessDemand(ctx, demand)` | demand loaded ; check responsibility |
| `ensureUserCanProcessDemandById(ctx, demandId)` | only id ; check responsibility |

```ts
await ensureUserCanProcessDemand(ctx, demand); // one line, semantics in the name
```

Apply in the **service layer** (not routes) so every entry point is protected.

### ⚠️ Always read permissions through `ctx.getPermissions()`

`user_permissions` is the persistent source of truth, but during impersonation `ctx.getPermissions()` returns the JWT-stored impostured permissions instead.

- **Never** read `user_permissions` directly in SQL to compute per-user data exposed in API responses (e.g. an `is_responsible` flag, a "my demands" view) — bypasses impersonation, wrong results.
- For per-row permission-derived flags, compute in JS after fetching, using the already-loaded permissions array.
- SQL on `user_permissions` is fine for **aggregations across all users** (e.g. `access_counts`) — impersonation only affects the current user's view.

Rule: if the SQL filters by `user_id = $currentUser`, you're probably writing a bug.

### Permission-match predicates (style)

When looping over `Permission[]`, **extract named predicates** at module level rather than nesting `permissions.some(p => { if/if/if })`:

```ts
const matchesNetworkAffectation = (demand: DemandForAccess) => (p: Permission): boolean => /* … */;
const matchesTerritory = (demand: DemandForAccess) => (p: Permission): boolean => /* … */;
return permissions.some((p) => matchesNetworkAffectation(demand)(p) || matchesTerritory(demand)(p));
```

Pre-conditions (admin / role / validated) collapse into one guard line at the top.

### tRPC authorization — gate twice

- **Route level** = role gate (e.g. `demandAccessRoute` restricts to admin + gestionnaire/collectivite/alec).
- **Service level** = resource ownership / responsibility gate (`ensureUserCan*` on the loaded resource).
- **Always do both.** Load the resource (throws `NOT_FOUND`) then `ensure*` (throws `FORBIDDEN`) before mutating.

Legacy `src/pages/api/` routes not yet migrated: wrap with `handleRouteErrors` from `@/server/helpers/server` (auth + error handling).

### Key rules

- Check permissions in the **service layer**, not just routes.
- Admin overrides all operations.
- Gestionnaires scoped to assigned networks ; collectivités/ALEC to their territory — both via `user_permissions`.
- Use `ctx.getPermissions()`, not `getUserPermissions(userId)` directly (impersonation support).
- **Never trust client-side role checks** — enforce server-side.
- Check resource ownership, not just "is logged in".

## Input validation

- Validate ALL external input with **Zod** (forms, API, URL params) at the entry point (tRPC route input, not deeper).
- Share Zod schemas between client (form) and server (tRPC input). Client-side validation alone is never enough.
- Sanitize user-generated content before rendering.

## Environment variables

- Server-only: no prefix (`DATABASE_URL`, `NEXTAUTH_SECRET`, `PIPEDRIVE_API_KEY`). Client-exposed: `NEXT_PUBLIC_` prefix.
- **Never put secrets in `NEXT_PUBLIC_` variables.** Validate required env vars at startup.
- `.env.example` committed (placeholders) ; `.env.local` gitignored (real dev values).

## Security headers

Configured in `next.config.ts`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, plus `helmet` middleware.

## Vulnerability prevention

| Vulnerability | Prevention |
|--------------|-----------|
| XSS | React escapes by default. No `dangerouslySetInnerHTML` without sanitization. |
| SQL injection | Kysely parameterizes. Never concatenate user input into SQL. |
| CSRF | NextAuth CSRF protection. tRPC validates origin. |
| Auth bypass | Role checks in services, not just routes. Verify every request. |
| Secrets exposure | `.env.local` gitignored. Never log secrets. Never `NEXT_PUBLIC_` for secrets. |
| Insecure direct object ref | Always verify the user has access to the requested resource. |

## Event logging

Security-relevant events logged via the `events` module (login attempts, role changes, demand status changes, admin impersonation). Log with the contextualized logger (userId, action). **Never log PII** (passwords, tokens, personal data).
