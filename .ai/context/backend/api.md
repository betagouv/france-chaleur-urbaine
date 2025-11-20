## Backend (API & TRPC)

## API Strategy

- **Preferred**: TRPC routes in `module/<moduleName>/trpc-routes.ts`
- **Legacy**: REST in `src/pages/api/*` (migrate to TRPC when touching)
- **Pattern**: Business logic in `module/<moduleName>/service.ts`, NOT in routes

## TRPC Routes (Preferred)

### File Structure

```typescript
// module/<moduleName>/trpc-routes.ts
import { route, router, routeRole } from '@/modules/trpc/server';
import * as moduleService from './service';

export const moduleRouter = router({
  create: route.input(zCreateInput).mutation(async ({ input, ctx }) => {
    return await moduleService.create(input, ctx);
  }),
  list: routeRole(['admin']).query(async ({ ctx }) => {
    return await moduleService.list({}, ctx);
  }),
});
```

### Authentication

**Role-based**:
```typescript
// Single role check
.meta({ auth: { roles: ['admin'] } })

// Multiple roles (OR logic)
.meta({ auth: { roles: ['admin', 'gestionnaire'] } })

// Helper shorthand
routeRole(['admin', 'gestionnaire'])
```

**Custom auth**:
```typescript
.meta({ 
  auth: { 
    custom: async (ctx, input) => ctx.user?.id === input.userId 
  } 
})
```

### Input Validation

- Define Zod schemas in `module/constants.ts` (shared client/server)
- Use `.input(zodSchema)` on route
- Access validated data via `input` parameter

### Context Access

Routes receive `ctx` with:
- `ctx.user` - Current user (or undefined)
- `ctx.userId` - User ID (or undefined)
- `ctx.hasRole(role)` - Check user role
- `ctx.logger` - Contextualized logger

### Query vs Mutation

- `.query()` - GET operations (no side effects)
- `.mutation()` - POST/PUT/DELETE (side effects)

### Rate Limiting

```typescript
.meta({
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 1,
    message: "Limite atteinte",
  },
})
```

See `@/modules/security/AGENTS.md` for details.

### Register Routes

Add to `src/modules/trpc/server/routes.ts`:
```typescript
import { moduleRouter } from '@/modules/module/<moduleName>/trpc-routes';

export const appRouter = router({
  module: moduleRouter,
});
```

## Legacy REST Routes (Migrate)

### Pattern
```typescript
// pages/api/endpoint.ts
import { handleRouteErrors } from '@/server/helpers/server';

export default handleRouteErrors(
  async (req, res) => {
    // handler
  },
  {
    requireAuthentication: ['admin'],
  }
);
```

### CRUD Pattern
```typescript
const { GET, POST, PUT, DELETE } = crud({ 
  validation: { create: zSchema },
  create: async (data, opts, ctx) => { /* ... */ }
});

export default handleRouteErrors(
  { GET, POST, PUT, DELETE },
  { requireAuthentication: ['admin'] }
);
```

**When touching legacy routes**: Migrate to TRPC in appropriate module.

## Services (Business Logic)

- **Location**: `module/<moduleName>/service.ts` or `module/<moduleName>/<name>-service.ts` (if multiple services)
- **Exports**: Named exports (not default): `create`, `update`, `list`, `get`, `remove`
- **Reusable**: Called from TRPC, legacy API, CLI, jobs

### Service Pattern
```typescript
// module/<moduleName>/service.ts
export const create = async (data: CreateInput, ctx: Context) => {
  // 1. Validate business rules
  // 2. Database operations
  // 3. Side effects (events, emails)
  // 4. Return result
};
```

### Context Usage
- Prefer `ctx.logger` over global logger
- Use `ctx.user` for user context
- Pass full `ctx` to nested service calls

## Error Handling

- TRPC: Throw `TRPCError` with code (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`)
- Legacy: Throw `BadRequestError` or standard errors
- See `.ai/context/quality/errors.md`

## Best Practices

- Keep routes thin: auth, validation, call service
- Put ALL business logic in services
- Use Zod for input validation (in `constants.ts`)
- Type inputs/outputs with inferred Zod types
- Log significant operations via `ctx.logger`
