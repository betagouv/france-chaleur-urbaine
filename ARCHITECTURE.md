# Architecture Documentation - France Chaleur Urbaine

> **📋 READ THIS FIRST**: This file documents the **specific architecture** of the France Chaleur Urbaine project.
>
> For **general architecture principles** (module system, conventions), see `.ai/context/architecture.md`

## Project Overview

**France Chaleur Urbaine** is a Next.js application helping French citizens connect to district heating networks. 

**Tech Stack**: TypeScript, PostgreSQL+PostGIS, DSFR (French gov design system)

**🏗️ Current Status**: Hybrid architecture - Modern modules (16 active) + legacy code (being migrated).

## 📁 Directory Structure

```
docs/                    # Legacy documentations (do not use)
src/
├── 🟢 app/global.css    # Only used for global CSS
├── 🟢 modules/          # Modern module-based architecture (24 modules)
├── 🟢 components/       # UI components (keep current structure)
├── 🟢 hooks/            # React hooks (keep current structure)  
├── 🟢 config/           # Configuration files (keep current structure)
├── 🟢 data/             # Static data (keep current structure)
├── 🟢 styles/           # Styling (keep current structure)
├── 🟢 utils/            # Utilities (keep current structure)
├── 🟢 pages/            # Next.js pages (keep current structure)
├── 🔴 server/           # Legacy server services (15+ files)
├── 🔴 services/         # Legacy client services (10+ files)
└── 🔴 types/            # Legacy type definitions
```

**Legend**: 🟢 Well-structured (keep) | 🔴 Legacy (migrate to modules)

## 🏛️ Module-Based Architecture

> **General module principles** in `.ai/context/architecture.md`. This section = project-specific modules.

### ✅ Existing Modules

| Module | Purpose | Status | AGENTS.md | Business Area |
|--------|---------|--------|-----------|---------------|
| **auth** | Authentication (NextAuth) | ✅ Active | ✅ Complete | User Management |
| **users** | User CRUD, roles, profiles | ✅ Active | ✅ Complete | User Management |
| **reseaux** | Heat/cold networks (core business) | ✅ Active | ✅ Complete | Core Business |
| **tiles** | Map tile generation (Tippecanoe) | ✅ Active | ✅ Complete | Mapping |
| **pro-eligibility-tests** | Bulk address eligibility testing | ✅ Active | ✅ Complete | Core Business |
| **trpc** | Type-safe API layer (infrastructure) | ✅ Active | ✅ Complete | Infrastructure |
| **jobs** | Async job processing (cron + queue) | ✅ Active | ✅ Complete | Infrastructure |
| **tags** | Tagging system for resources | ✅ Active | ✅ Complete | Data Management |
| **events** | Event logging system | ✅ Active | ✅ Complete | Monitoring |
| **analytics** | Analytics config (Matomo, FB) | ✅ Active | ✅ Complete | Monitoring |
| **data** | Data extraction & summary | ✅ Active | ✅ Complete | Data Management |
| **config** | Context builders | ✅ Active | ❓ Check | Infrastructure |
| **diagnostic** | System diagnostics | ✅ Active | ❓ Check | Monitoring |
| **notification** | Notifications | ✅ Active | ❓ Check | Communication |
| **media-kit** | Media resources | ✅ Active | ❓ Check | Content |
| **ban** | Base Adresse Nationale API | ✅ Active | ❓ Check | External APIs |
| **form** | Reusable form components (Autocomplete) | ✅ Active | ✅ Complete | UI Components |

**Module Documentation**: Each module has `AGENTS.md` with structure, API, examples. See `.ai/context/modules.md` for module conventions.

## 🔴 Legacy Code Areas (Migration Required)

### High Priority Business Logic

| Area | Files | Target Module | Priority |
|------|--------|---------------|----------|
| **Demands Management** | `src/server/services/demande.ts`<br>`src/services/demande.ts`<br>Legacy API routes in `src/pages/api/demandes/` | `demands` | 🔥 Critical |
| **Eligibility Testing** | `src/server/services/addresseApi.ts`<br>`src/services/` (address-related)<br>Legacy API routes in `src/pages/api/eligibilite/` | `eligibility` | 🔥 Critical |
| **Statistics** | `src/server/services/stats.ts`<br>Legacy API routes in `src/pages/api/statistics/` | `statistics` | 🔥 High |
| **Email Templates** | `src/server/services/email.ts`<br>`src/server/services/contents.ts` | `emails` | 🟡 Medium |
| **File Exports** | `src/server/services/export.ts`<br>Legacy API routes in `src/pages/api/export/` | `exports` | 🟡 Medium |
| **File Uploads** | `src/server/services/upload.ts`<br>Legacy API routes in `src/pages/api/upload/` | `uploads` | 🟡 Medium |

### Legacy API Routes

**Location**: `src/pages/api/` - Some legacy endpoints need migration to modules
**Target**: Convert to TRPC routes in respective modules  
**Pattern**: Legacy `/api/feature` → `modules/feature/server/trpc-routes.ts`
**Note**: Next.js pages structure is correct, only migrate business logic to modules

### Legacy Services

| Type | Location | Count | Migration Status |
|------|----------|--------|------------------|
| Server Services | `src/server/services/` | 15+ files | 🔄 In Progress |
| Client Services | `src/services/` | 10+ files | 🔄 In Progress |

## 🎯 Migration Strategy

### Phase 1: Core Business Logic
1. **demands** module - Most critical business logic
2. **eligibility** module - Address testing system
3. **statistics** module - Analytics consolidation

### Phase 2: Infrastructure  
4. **emails** module - Template management
5. **exports** module - Data export functionality
6. **uploads** module - File management

### Phase 3: Cleanup
7. Remove legacy files after confirming all imports updated
8. Update documentation and tests

## 🛠️ Development Workflow

> **General conventions** in `.ai/context/architecture.md`. This section = project-specific workflow.

### 🚨 Before Making Changes

1. **Read this ARCHITECTURE.md** - Understand project structure, modules, legacy areas
2. **Read module's AGENTS.md** - If working in `src/modules/MODULE/`, read its AGENTS.md
3. **Check migration status** - Is the code in legacy area? Consider migrating to module first

### Working with Modules

See `.ai/context/modules.md` for module conventions. Key project-specific points:

- **Prefer modules over legacy**: When touching legacy code, consider migrating it
- **TRPC over REST**: New endpoints → use TRPC in modules, not `/api` routes
- **Document in AGENTS.md**: Update module's AGENTS.md when adding features

### Migration Priority

When touching legacy code, prioritize migrating these areas (see Legacy Code Areas section below):
1. **demands** (Critical)
2. **eligibility** (Critical)  
3. **statistics** (High)
4. Others as encountered

## 🔧 Technical Stack

### Core Technologies
- **Next.js 15** (Pages Router, not App Router)
- **TypeScript** (strict mode)
- **PostgreSQL + PostGIS** (spatial data)
- **Kysely** (type-safe SQL)
- **TRPC** (type-safe APIs)
- **MapLibre GL** (mapping)
- **DSFR** (French gov design system)

### Architecture Patterns
- **Module-based separation** of concerns
- **TRPC** for modern type-safe APIs (replacing REST)
- **Kysely** for all database operations
- **React Query** for server state management
- **Jotai** for client state management
- **React Hook Form + Zod** for form validation

## 📝 Documentation Standards

### AGENTS.md Files
Every module MUST have a `AGENTS.md` file containing:
- **Structure** - File organization
- **API documentation** - Hooks, components, services
- **Database schema** - If applicable
- **Usage examples** - Code samples
- **Environment variables** - Configuration needed

### Code Documentation
- Use TypeScript types extensively
- Add comments ONLY for complex business logic
- Follow existing patterns in similar files
- Document public APIs in module exports

## 🗂️ Well-Structured Areas (Keep Current)

### Next.js Structure (`src/pages/`)
- **Pages**: Next.js page components and routing
- **API Routes**: Some contain legacy business logic to migrate to modules

### Components (`src/components/`)
- **ui/**: 30+ design system components
- **form/**: Comprehensive form system with DSFR integration
- **Map/**: MapLibre GL mapping components

### Infrastructure
- **Database**: 99+ tables with full Kysely type safety
- **Types**: Comprehensive TypeScript definitions
- **Utilities**: Shared helper functions
- **Hooks**: Reusable React hooks

## 🚀 Getting Started

### For New Features
1. Determine if feature belongs in existing module or needs new one
2. Read relevant AGENTS.md files for patterns
3. Follow module structure conventions
4. Create TRPC routes instead of REST APIs
5. Update this ARCHITECTURE.md if creating new module

### For Bug Fixes
1. Locate the responsible module or legacy code
2. If in legacy code, consider migrating to module
3. Follow existing patterns in the codebase
4. Run `pnpm lint` and `pnpm ts` before committing

### For Code Review
1. Verify ARCHITECTURE.md and AGENTS.md files were consulted
2. Check module structure compliance
3. Ensure no server imports in client code
4. Confirm legacy code migration strategy if applicable

---

**📌 Keep This File Updated**: Update this ARCHITECTURE.md whenever you:
- Create new modules
- Migrate legacy code
- Change architectural patterns
- Add new conventions

**Last Updated**: 2025-09-25