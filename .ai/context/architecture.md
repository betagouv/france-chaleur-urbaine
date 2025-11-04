## Architecture Principles

**Project-specific details** in `ARCHITECTURE.md` at root. This file = general principles.

## Core Architecture

- **Framework**: Next.js Pages Router (NOT App Router)
- **Language**: TypeScript strict mode
- **Pattern**: Module-based architecture + legacy code (hybrid)

## Module System

**Structure**: `src/modules/MODULE_NAME/`

```
module-name/
├── AGENTS.md              # Module docs (REQUIRED)
├── server.ts              # Server exports
├── client.ts              # Client exports
├── types.ts               # Shared types
├── constants.ts           # Zod schemas (shared client/server)
├── server/
│   ├── service.ts         # Business logic
│   ├── trpc-routes.ts     # TRPC endpoints (preferred)
│   └── api.ts             # Legacy REST (migrate to TRPC)
└── client/
    ├── hooks.tsx          # React hooks
    └── components/        # React components
```

## Critical Rules

1. **Module imports**: ALWAYS `./` or `../`, NEVER `@/modules`
2. **Client/Server**: Client NEVER imports from `server/`, use `types.ts` for shared types
3. **TRPC preferred**: New endpoints → TRPC, not REST `/api`
4. **Business logic**: In `module/server/service.ts`, NOT in API routes
5. **Module docs**: EVERY module MUST have `AGENTS.md`

## Pages Router Conventions

- **Pages**: `src/pages/` for routes
- **API**: `src/pages/api/` for endpoints (migrate to TRPC)
- **App**: `src/app/` ONLY for global.css

## Development Workflow

**ALWAYS before editing**:
1. Read `ARCHITECTURE.md` for project-specific structure
2. Read module's `AGENTS.md` if working in a module
3. Read 2-3 similar files to follow patterns

## Legacy Migration

- **Legacy locations**: `src/server/services/`, `src/services/`, `src/pages/api/`
- **Target**: Migrate to modules with TRPC
- **During transition**: Re-export in legacy locations for backward compatibility

