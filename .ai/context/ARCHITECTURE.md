# Architecture Documentation

<!-- Source: /ARCHITECTURE.md -->

> **📋 READ THIS FIRST**: This file provides a comprehensive overview of the France Chaleur Urbaine codebase architecture. Always consult this file and relevant module CLAUDE.md files before making changes.

## Project Overview

France Chaleur Urbaine is a Next.js application helping French citizens connect to district heating networks. Built with TypeScript, PostgreSQL+PostGIS, and following French government design standards (DSFR).

**🏗️ Current Architecture Status**: Hybrid - Modern module-based architecture coexisting with legacy code being gradually migrated.

## 📁 Directory Structure

```
src/
├── 🟢 modules/           # Modern module-based architecture (14 modules)
├── 🟢 components/        # UI components (keep current structure)
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

### ✅ Existing Modules (14)

| Module | Purpose | Status | CLAUDE.md |
|--------|---------|--------|-----------|
| **auth** | Authentication (NextAuth) | ✅ Active | ✅ Complete |
| **jobs** | Async job processing | ✅ Active | ✅ Complete |
| **reseaux** | Heat/cold networks | ✅ Active | ✅ Complete |
| **tiles** | Map tile generation | ✅ Active | ✅ Complete |
| **trpc** | Type-safe API layer | ✅ Active | ✅ Complete |
| **pro-eligibility-tests** | Pro eligibility | ✅ Active | ✅ Complete |
| **tags** | Tagging system | ✅ Active | ✅ Complete |
| **users** | User management | ✅ Active | ✅ Complete |
| **events** | Event logging | ✅ Active | ✅ Complete |
| **analytics** | Analytics config | ✅ Active | ✅ Complete |
| **config** | Context builders | ✅ Active | ❓ Check |
| **diagnostic** | System diagnostics | ✅ Active | ❓ Check |
| **notification** | Notifications | ✅ Active | ❓ Check |
| **media-kit** | Media resources | ✅ Active | ❓ Check |

### 🏗️ Standard Module Structure

Each module follows a consistent structure. See `src/modules/CLAUDE.md` for complete details and rules.

### 🚫 Module Rules (CRITICAL)

1. **Internal imports**: Use `./` or `../` within modules, NEVER `@/modules`
2. **Client/Server separation**: Client code NEVER imports from server
3. **Type sharing**: Use `types.ts` at module root for shared types
4. **Backward compatibility**: Re-export in legacy locations during transition

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

### 🚨 CRITICAL RULE - Always Follow This

**BEFORE editing any files, you MUST:**
1. **Read ARCHITECTURE.md** (this file) to understand the current structure
2. **Read the relevant module's CLAUDE.md** file to understand conventions
3. **Read at least 2-3 similar existing files** to follow patterns

### Making Changes

#### Working with Existing Modules
1. Check if module has `CLAUDE.md` - follow its specific conventions
2. Use relative imports (`./`, `../`) within modules
3. Never import server code in client code
4. Add types to `types.ts` if shared between client/server

#### Creating New Modules
1. Follow standard module structure above
2. Create comprehensive `CLAUDE.md` documentation
3. Add `.env.example` for environment variables
4. Update this ARCHITECTURE.md file

#### Working with Legacy Code
1. **Prefer migrating to modules** over editing legacy files
2. If editing legacy code is necessary, plan migration path
3. Add TODOs indicating module migration target
4. Update re-exports for backward compatibility

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

### CLAUDE.md Files
Every module MUST have a `CLAUDE.md` file containing:
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
2. Read relevant CLAUDE.md files for patterns
3. Follow module structure conventions
4. Create TRPC routes instead of REST APIs
5. Update this ARCHITECTURE.md if creating new module

### For Bug Fixes
1. Locate the responsible module or legacy code
2. If in legacy code, consider migrating to module
3. Follow existing patterns in the codebase
4. Run `pnpm lint` and `pnpm ts` before committing

### For Code Review
1. Verify ARCHITECTURE.md and CLAUDE.md files were consulted
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

---

<!-- Source: /CLAUDE.md -->

## Architecture & Key Patterns

### Tech Stack
- **Next.js 15** with Pages Router (not App Router)
- **TypeScript** with strict mode
- **PostgreSQL + PostGIS** for spatial data
- **Kysely** for type-safe SQL queries
- **MapLibre GL** for map rendering
- **@codegouvfr/react-dsfr** for UI components

### Project Structure
```
src/
├── components/         # React components by feature
├── pages/              # Next.js pages & API routes
├── modules/            # Code separated in modules for separation of concerns
├── server/             # Server-side services
├── services/           # Client-side services
├── utils/              # Shared utilities
└── types/              # TypeScript definitions
```

### Module Structure
Each module should be structured like this

```
modules/
├── feature-name/     # All feature code
  ├── client/         # React components by feature
  ├── server/         # Server files (logic, apis, services)
  ├── constants       # If needed, constants
  ├── README.md       # Description of feature and possible dependencies
```

### Key Architectural Decisions

1. **API Routes Pattern**: All data operations go through `/api/` endpoints

If not in a distinct module

```typescript
// Client: src/services/
// API: src/pages/api/
// Server: src/server/services/
```

If in a distinct module

```typescript
// Client: src/modules/module-name/client/
// API: src/modules/module-name/client/api.ts
// Server: src/modules/module-name/server/
```

2. **Database Access**: Always use Kysely for type safety
```typescript
   import { kdb } from '@/server/db/kysely'
   const networks = await db.selectFrom('reseaux_de_chaleur').selectAll().execute()
```

3. **Map Integration**: Use MapLibre components in `src/components/Map/`
   - Custom layers defined in `src/services/Map/` 
   - Coordinate transformations via Turf.js utilities

4. **Form Handling**: Tanstack React Form with Zod validation
```typescript
  // See src/components/form/ for examples
```

5. **State Management**:
   - Server state: @tanstack/react-query
   - Client state: jotai atoms
   - URL state: nuqs hooks and useQueryFlag.tsx if no need for a value

6. **HTML Markup**

- Use semantic HTML markup when needed
- Reduce the number of imbricated tags to the bare minimum

