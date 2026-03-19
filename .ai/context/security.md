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
  PROFESSIONNEL = 'professionnel', // Professional (bulk testing, demand submission)
  PARTICULIER = 'particulier',    // Individual citizen
  DEMO = 'demo',                 // Pseudo-anonymized UI view (used by admin to preview as anonymous user)
}
```

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

### Key rules

- Always check permissions in the **service layer** (not just routes).
- Admin role has full override on all operations.
- Gestionnaires are scoped to their assigned networks.
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
