## Modules Architecture

**Location**: `src/modules/` (16+ modules)  
**Pattern**: Self-contained modules with server/client separation

## Module Context Loading

When working in `src/modules/MODULE_NAME/`:
- **ALWAYS load** `src/modules/MODULE_NAME/AGENTS.md`

## Standard Module Structure

```
module-name/
├── AGENTS.md              # Module documentation (REQUIRED)
├── server.ts              # Server exports (for other modules)
├── client.ts              # Client exports (for React)
├── types.ts               # Shared types (client + server)
├── constants.ts           # Zod schemas (shared validation)
├── commands.ts            # CLI commands (optional)
├── module-name.config.ts  # Config (jobs, routes)
├── server/
│   ├── service.ts         # Business logic (main)
│   ├── <name>-service.ts  # Additional services
│   ├── trpc-routes.ts     # TRPC endpoints (preferred)
│   ├── api.ts             # Legacy REST endpoints
│   └── api-admin.ts       # Admin REST endpoints
└── client/
    ├── hooks.tsx          # React hooks
    └── components/        # React components
```

## Critical Rules

1. **Internal imports**: Use `./` or `../`, NEVER `@/modules/module-name`
2. **Client/Server separation**: Client NEVER imports from `server/`
3. **Type sharing**: Use `types.ts` at module root
4. **Documentation**: EVERY module MUST have `AGENTS.md`
5. **Named exports**: No default exports (except pages)

## Import Patterns

```typescript
// ✅ Correct - Internal relative imports
import { myService } from './server/service';
import type { MyType } from './types';

// ✅ Correct - External module imports
import { otherService } from '@/modules/other/server';

// ❌ Wrong - Self-referencing with @/modules
import { myService } from '@/modules/my-module/server';

// ❌ Wrong - Client importing server
// In client.ts or client/
import { service } from './server/service'; // FORBIDDEN
```

## Creating a New Module

1. **Create structure** following template above
2. **Write `AGENTS.md`** with API docs and examples
3. **Register TRPC routes** in `src/modules/trpc/server/routes.ts`:
   ```typescript
   import { myModuleRouter } from '@/modules/my-module/server/trpc-routes';
   
   export const appRouter = router({
     myModule: myModuleRouter,
   });
   ```
4. **Register CLI** (if applicable) in `scripts/cli.ts`
5. **Update `ARCHITECTURE.md`** with new module

## Exports Pattern

**server.ts** (server-only exports):
```typescript
export * from './server/service';
export type * from './types';
```

**client.ts** (client-only exports):
```typescript
export * from './client/hooks';
export type * from './types';
```

## Key Modules (Infrastructure)

- **trpc** - Type-safe API layer (use for all new endpoints)
- **auth** - Authentication (NextAuth integration)
- **jobs** - Background jobs (cron + async processor)
- **events** - Event logging system
- **notification** - Toast notifications + error handling
- **security** - Rate limiting

## Key Modules (Business)

- **reseaux** - Heat/cold networks (core business)
- **demands** - User demand management
- **tiles** - Map tile generation (Tippecanoe)
- **pro-eligibility-tests** - Bulk address testing
- **users** - User CRUD and profiles

## Module Communication

- **Services call other services** via `@/modules/other/server`
- **Client uses TRPC hooks** via `trpc.module.endpoint.useQuery()`
- **Shared types** via `types.ts` at module root
- **Events** via event bus for decoupling