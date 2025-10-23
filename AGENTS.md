# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- This section has been moved to .ai/context/OVERVIEW.md -->

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

# Images
pnpm cli optimize images  # Optimize all images in public/ directory
```

## Architecture & Key Patterns

<!-- This section has been moved to .ai/context/OVERVIEW.md -->

<!-- This section has been moved to .ai/context/ARCHITECTURE.md -->

<!-- This section has been moved to .ai/context/ARCHITECTURE.md -->

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

<!-- Workflow modification and coding guidelines have been moved to .ai/context/CODING-STYLE.md -->

<!-- Architecture and deployment information has been moved to .ai/context/ARCHITECTURE.md -->
