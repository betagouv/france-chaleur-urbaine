## Modules Architecture

**Location**: `src/modules/` (16+ modules)

## Module Context Loading

When working in `src/modules/MODULE_NAME/`:
- Always load `src/modules/MODULE_NAME/AGENTS.md` if it exists

## Standard Module Structure

```
module-name/
├── AGENTS.md              # Module documentation (REQUIRED)
├── server.ts              # Server exports
├── client.ts              # Client exports
├── types.ts               # Shared types
├── constants.ts           # Zod schemas, shared constants
├── commands.ts            # CLI commands (optional)
├── module-name.config.ts  # Config (jobs, routes)
├── server/
│   ├── service.ts         # Business logic
│   ├── trpc-routes.ts     # TRPC endpoints (prefer over API)
│   ├── api.ts             # Legacy REST endpoints
│   └── api-admin.ts       # Admin REST endpoints
└── client/
    ├── hooks.tsx          # React hooks
    └── components/        # React components
```

## Critical Rules

1. **Internal imports**: ALWAYS use `./` or `../`, NEVER `@/modules`
2. **Client/Server separation**: Client NEVER imports from `server/`
3. **Type sharing**: Use `types.ts` at module root for shared types
4. **Documentation**: EVERY module MUST have `AGENTS.md`

## Creating a Module

1. Follow structure above
2. Create comprehensive `AGENTS.md` (see `src/modules/AGENTS.md`)
3. Register TRPC routes in `src/modules/trpc/server/routes.ts`
4. CLI commands: register in `scripts/cli.ts`
5. Update `ARCHITECTURE.md`

## Key Modules

- **trpc** - Type-safe API (use for all new endpoints)
- **auth** - Authentication (NextAuth integration)
- **jobs** - Background jobs (cron + async processor)
- **reseaux** - Heat/cold networks (core business)
- **tiles** - Map tiles generation
- **pro-eligibility-tests** - Bulk address testing

