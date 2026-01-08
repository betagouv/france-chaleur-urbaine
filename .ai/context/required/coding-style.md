## Coding Style

## General

- **Explicit, descriptive names** (Clean Code); avoid abbreviations
- **Comments only** for non-obvious logic/constraints
- **Match existing formatting**; keep lines short
- **Be concise**, avoid duplication

## TypeScript

- **Types over interfaces**; avoid enums (use const objects)
- **Functions = verbs**; variables = meaningful nouns
- **Guard clauses** and limit nesting
- **Catch only with meaningful handling**
- **Parallelize independent operations** with `Promise.all()`
- **Add tests** for non-trivial logic
- **Named exports**, not default exports
- **CRITICAL**: After ANY file modification, you MUST verify ALL of the following:
  1. **Linting and formatting**: Run `pnpm lint` and fix ALL lint errors (use `pnpm lint:fix` if needed)
  2. **Type checking**: Run `pnpm ts` and fix ALL type errors
  3. **Tests**: Run `pnpm test` and ensure all tests pass
  4. Only submit code when ALL checks pass (lint + types + tests)

## React

- **Extract prop types** for exported components
- **Keep components small** and focused
- **Extract complex logic** into custom hooks
- **No styled-components** (deprecated) - Use Tailwind
- **No Box component** (deprecated) - Use Tailwind classes

## HTML

- **Semantic HTML** markup
- **Minimize nested tags**

## Project Conventions

**Language**:
- Code (functions, variables, comments, logs, docs, commits): **English**
- UI text: **French** (or as needed)

**File naming**:
- Components: `PascalCase.tsx` (`MyComponent.tsx`)
- Utils/services: `kebab-case.ts` (`my-service.ts`)
- Test files: `*.spec.ts` (unit), `*.test.ts` (integration)

**Imports**:
- Use `@/` path aliases (`@/modules`, `@/components`, `@/utils`)
- Within modules: Use relative imports (`./`, `../`), not `@/modules`
- Never import server code in client

**Exports**:
- **Named exports**, not default (except pages)
- Services: `export const myFunction = ...`
- Types: `export type MyType = ...`

**File types**: TypeScript only (`.ts`, `.tsx`)
