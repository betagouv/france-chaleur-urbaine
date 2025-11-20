## Architecture Principles

**Project-specific details** in `ARCHITECTURE.md` at root. This file = general principles.

## Core Stack

- **Framework**: Next.js 15 Pages Router (NOT App Router)
- **Language**: TypeScript strict mode
- **Database**: PostgreSQL 16+ + PostGIS 3.5+
- **ORM**: Kysely (type-safe SQL)
- **API**: TRPC v11 (type-safe RPC)
- **Auth**: NextAuth (credentials)
- **Forms**: Tanstack Form + Zod
- **Maps**: MapLibre GL
- **Styling**: Tailwind CSS + DSFR
- **State**: React Query (server) + Jotai (client) + nuqs (URL)
- **Jobs**: Custom async processor with cron

## Module System

**General principles**: See `.ai/context/required/modules.md` for module structure.

**Key principles**:
- Module-based architecture (16+ modules in `src/modules/`)
- Type-safe APIs (TRPC) preferred over REST
- Business logic in service layer, NOT in API routes
- Each module has `AGENTS.md` documentation

## Pages Router Conventions

- **Pages**: `src/pages/` for routes
- **API**: `src/pages/api/` for endpoints (legacy - migrate to TRPC)
- **App**: `src/app/` ONLY for `global.css`

## Directory Structure

```
src/
├── modules/          # Modern architecture (16+ modules)
├── components/       # Shared React components
├── hooks/            # Shared React hooks
├── utils/            # Utilities
├── pages/            # Next.js pages
├── server/           # Legacy (migrate to modules)
└── services/         # Legacy (migrate to modules)
```

## Development Workflow

**ALWAYS before editing**:
1. Read project `ARCHITECTURE.md` at root
2. Read module's `AGENTS.md` if working in a module
3. Read 2-3 similar files to follow existing patterns
4. Check `.ai/context/` for relevant patterns

**For new features**:
1. Determine if belongs in existing module or needs new one
2. Follow module structure conventions
3. Use TRPC for API endpoints (not REST)
4. Update `AGENTS.md` and `ARCHITECTURE.md`

## Legacy Code Migration

**Legacy locations** (being migrated):
- `src/server/services/` → Module services
- `src/services/` → Module client code
- `src/pages/api/` → TRPC routes

**Strategy**:
- When touching legacy code, consider migrating to module
- Priority: demands, eligibility, statistics
- During transition: Re-export for backward compatibility

## Best Practices

- **Modules over legacy** - Prefer module structure
- **TRPC over REST** - New endpoints use TRPC
- **Services for logic** - Keep routes thin
- **Kysely for DB** - Type-safe queries
- **Zod for validation** - Client and server
