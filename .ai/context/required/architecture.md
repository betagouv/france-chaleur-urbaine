## Architecture Principles

**Project-specific details** in `ARCHITECTURE.md` at root. This file = general principles.

## Core Architecture

- **Framework**: Next.js Pages Router (NOT App Router)
- **Language**: TypeScript strict mode
- **Pattern**: Module-based architecture (see `.ai/context/required/modules.md`)

## Module System

**General principles**: See `.ai/context/required/modules.md` for module structure and details.

**Key principles**:
- Module-based architecture for code organization
- Type-safe APIs (TRPC) preferred over REST
- Business logic in service layer, NOT in API routes

## Pages Router Conventions

- **Pages**: `src/pages/` for routes
- **API**: `src/pages/api/` for endpoints (migrate to TRPC)
- **App**: `src/app/` ONLY for global.css

## Development Workflow

**ALWAYS before editing**:
1. Read project-specific architecture docs (`ARCHITECTURE.md`)
2. Read module's documentation if working in a module
3. Read 2-3 similar files to follow existing patterns

## Large Tasks

For refactors, new features, or migrations:
- Also load project-specific architecture docs (`ARCHITECTURE.md`) for details (modules list, legacy areas, migration strategy)

## Legacy Code Migration

- **Legacy locations**: `src/server/services/`, `src/services/`, `src/pages/api/`
- **Target**: Migrate to modules with TRPC
- **During transition**: Re-export in legacy locations for backward compatibility
