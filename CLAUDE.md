# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

France Chaleur Urbaine is a public service platform for connecting to district heating networks in France. It's a Next.js application with geospatial features, built to French government standards (DSFR).

## Essential Commands

```bash
# Development
pnpm dev                   # Start dev server (port 3000)
pnpm dev:email             # Email template development

# Code Quality (ALWAYS run before committing)
pnpm lint                  # ESLint check
pnpm lint:fix              # Fix linting issues
pnpm prettier-check        # Code formatting
pnpm lint:file             # Lint specific file
pnpm ts                    # Run typescript on all codebase

# Testing
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test src/utils/file.spec.ts  # Run single test

# Database
pnpm db:migrate            # Run migrations
pnpm db:sync               # Regenerate Kysely types (after schema changes)

# Build
pnpm build                 # Production build
pnpm build:analyze         # Analyze bundle size
```

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

## Workflow modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files**
that will help you to understand how to make a coherent and
consistent edit.

This is **NON-NEGOTIABLE**. Do not skip this step under any
circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes
- Try to use files that do "the same stuff" so you can have an
example

**Steps to follow:**

1. Read at least 3 relevant existing files first
2. Understand the patterns and conventions
3. Only then proceed with your editing files

### Common Development Tasks

Take all information from .cursor/rules folder

**Comments**
- Use comments ONLY when the complexity is strong

**Form**
- Always use src/components/form/react-form/useForm.tsx when creating a form
- Take example from src/components/Admin/UserForm.tsx
- Never use a Field.Custom in a Field.Custom

**Colors**
- Always use colors from colors.ts (priority to success, warning, accent, etc...)

**Display a Table**
- Always use TableSimple.tsx when needing to display a table
- Use existing TableCell through "type" and "cellProps"
- if you see a common pattern for a not existing Cell Type, add it to TableCell.tsx

**Creating a new component**
1. Check existings in src/components/ui or src/components/form if a component form
- Prefer the use of property "variant" and size in case it's needed
- Do not use Box as it's getting deprecated
- Do not use Text as it's getting deprecated
- Prefer creating it like src/components/ui/Component.tsx instead of src/components/Component/ui/Component/index.tsx
- If needed, use class-variance-authority like in src/components/ui/Section.tsx
- Always use `const ComponentName = ` and `export default ComponentName` for main component.
- Always use an object "props" as the first argument of your component

Example:

```typescript
export type MyComponentProps = React.HTMLAttributes<HTMLDivElement> & {
  prop1: string;
  prop2: number;
};

const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  return <div>{props.prop1}</div>;
};

export default MyComponent;
```

**Creating a new hook**
1. First check if one already exists in src/hooks or in @react-hookz/web
2. If it does not exist, add one in src/hooks

**Adding a new API endpoint:**
1. Create a new module or append to an existing module
2. Look into module "trpc" and add or update a `trpc-routes.ts`
3. Add service method in `<module>/server/service.ts`

**Working with the map:**
1. Map components in `src/components/Map/`
2. Layer definitions in `src/services/Map/layers/`
3. Geospatial utilities in `src/utils/geo/`

**Database changes:**
1. Create migration in `migrations/`
2. Run `pnpm db:migrate`
3. Run `pnpm db:sync` to update types
4. Update relevant services



## Important Notes

- **Node.js 20** and **pnpm 8** are required
- Path aliases configured: `@/` → `src/`, `@cli/` → `scripts/`
- French government design system (DSFR) must be used for UI
- All geographic data uses PostGIS and Turf.js for calculations
- Authentication uses custom session management (see `src/server/services/auth.ts`)
- Environment variables documented in `.env.example`

## Deployment

- **Main branch** → Production on Scalingo : no dev on it
- **Dev branch** → Development environment
- Pull requests create review apps automatically
- Clock container runs scheduled tasks (see `scripts/`)
