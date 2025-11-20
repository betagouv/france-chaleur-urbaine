## Security

## Authentication (NextAuth)

**Provider**: Credentials (email/password)  
**Roles**: `admin`, `gestionnaire`, `professionnel`, `particulier`, `demo`

```typescript
import { withAuthentication } from '@/server/authentication';

export const getServerSideProps = withAuthentication(['admin', 'gestionnaire']);
```

**Client-side**:
```typescript
import { useAuthentication } from '@/modules/auth/client/hooks';

const { user, isAuthenticated, hasRole } = useAuthentication();

if (hasRole('admin')) {
  // Admin only
}
```

## Authorization (TRPC)

**Role-based**:
```typescript
import { route, routeRole } from '@/modules/trpc/server';

// Specific roles
export const myRouter = router({
  list: route
    .meta({ auth: { roles: ['admin', 'gestionnaire'] } })
    .query(async ({ ctx }) => { ... }),
  
  // Shorthand
  delete: routeRole(['admin']).mutation(async ({ ctx }) => { ... }),
});
```

**Custom authorization**:
```typescript
.meta({
  auth: {
    custom: async (ctx, input) => {
      // Check resource ownership
      return ctx.user?.id === input.userId;
    },
  },
})
```

**Context helpers**:
- `ctx.user` - Current user or undefined
- `ctx.userId` - User ID or undefined
- `ctx.hasRole(role)` - Check if user has role
- `ctx.isAuthenticated` - Boolean

## Authorization (Legacy API)

```typescript
import { handleRouteErrors } from '@/server/helpers/server';

export default handleRouteErrors(
  async (req, res) => { ... },
  {
    requireAuthentication: ['admin'],
  }
);
```

## Input Validation

**Always validate on server** (client validation = UX only):

```typescript
// In constants.ts (shared)
export const createItemSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

// TRPC route
route.input(createItemSchema).mutation(async ({ input }) => {
  // input is validated and typed
});
```

**Zod automatically validates** - No manual `.parse()` needed with TRPC

## Secrets Management

- **Environment variables only** (`.env.local`)
- Never commit secrets to git
- Different secrets per environment (dev/staging/prod)
- Rotate API keys regularly

```bash
# .env.local (gitignored)
DATABASE_URL=postgres://...
NEXTAUTH_SECRET=...
```

## Role Hierarchy

**Admin** has all permissions (always checked in `requireAuthentication`)

```typescript
// In server helper
if (Array.isArray(roles) && !(roles.includes(user.role) || user.role === 'admin')) {
  throw invalidPermissionsError;
}
```

## Security Rules

1. **Never trust client** - Validate and authorize on server
2. **Fail securely** - Deny by default (no auth config = public)
3. **Check ownership** - Verify user owns resource
4. **Log security events** - Failed auth attempts, permission denials
5. **No PII in logs** - Never log passwords, tokens, emails
