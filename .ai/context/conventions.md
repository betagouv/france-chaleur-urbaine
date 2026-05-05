# Code Conventions

> Rules that Biome cannot enforce. If Biome catches it, don't list it here.

## File and folder naming

| Type | Pattern | Example |
|------|---------|---------|
| React components | PascalCase | `UserProfile.tsx` |
| Utilities/helpers | kebab-case | `format-date.ts` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Server services | kebab-case | `demands-service.ts` |
| tRPC routes | `trpc-routes.ts` (always) | `src/modules/demands/server/trpc-routes.ts` |
| Types | kebab-case | `user-types.ts` |
| Test files | same as source + `.spec` or `.test` | `demands-service.spec.ts` |
| Module constants | `constants.ts` (always) | `src/modules/demands/constants.ts` |
| Module types | `types.ts` (always) | `src/modules/demands/types.ts` |
| Styled components (legacy) | PascalCase + `.style` | `Map.style.tsx` |

## Naming conventions (code)

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase, function declaration | `function UserProfile() {}` |
| Functions/variables | camelCase | `const getUserById = ...` |
| Constants | UPPER_SNAKE_CASE | `const MAX_RETRIES = 3` |
| Types | PascalCase, `type` keyword | `type UserRole = ...` |
| Zod schemas | `z` prefix + PascalCase | `const zCreateDemand = z.object({...})` |
| Inferred types (from Zod) | PascalCase, no prefix | `type CreateDemand = z.infer<typeof zCreateDemand>` |
| Boolean variables | `is/has/should/can` prefix | `isLoading`, `hasAccess` |
| Event handlers | `handle` prefix | `handleSubmit` |
| tRPC procedures | verb-noun camelCase | `createDemand`, `getNetworkById` |

## Language

- **Code**: always English (variables, functions, types, comments, docs). When extending an existing block of comments/docs, match the surrounding language — never mix French and English in the same comment, docstring, or paragraph (the English code rule means surrounding context will already be English).
- **AI docs** (markdown files: `AGENTS.md`, `.ai/context/*.md`): always English.
- **UI text**: always French (labels, messages, placeholders, errors shown to users).
- **Zod error messages**: French when user-facing, English when developer-facing.
- **UTF-8**: always use real characters (`é`, `è`, `ê`, `à`, `ç`, `ù`), never unicode escapes (`\u00e9`).
- **Accents**: when writing in French (UI text, docs, responses), use correct accents. Don't translate code/scripts that are in English — respect the existing language of each file.

## Export patterns

- Named exports everywhere.
- Default exports only for Next.js pages (framework requirement).
- No barrel files (`index.ts`) except for module public APIs.
- Each module exposes its public API via direct imports, not re-exports.

## Import patterns

- `@/` alias for `src/` (absolute imports).
- `@cli/` alias for `scripts/`.
- `@root/` alias for project root.
- Within a module: relative imports (`./service`, `../constants`).
- Between modules: `@/modules/<name>/...`.
- Never use relative imports that go up more than one level.
- Import order (enforced by Biome): React/Next → external → `@/` internal → relative.

## Function and component patterns

- Use `function` declarations for components (not arrow functions).
- Use arrow functions for callbacks, utility functions, and handlers.
- Keep components under 150 lines — extract sub-components if longer.
- Place the props/params type definition immediately above the function/component that uses it, with no other definitions in between.
- Add a short multi-line TSDoc comment above each React component describing its purpose (1-3 content lines):
- No `forwardRef` unless absolutely necessary.
- Guard clauses for early returns instead of nested `if/else`.
- Explicit names over abbreviations (`networkIdentifier` not `netId`).

## TypeScript patterns

- Strict mode enabled. Never use `any` — use `unknown` and narrow.
- Prefer `type` over `interface` (unless extending is needed).
- Prefer const objects over enums.
- Use Zod schemas as single source of truth; derive types with `z.infer<>`.
- Use `Promise.all()` for independent parallel async operations.
- Prefer discriminated unions over optional fields:
  ```ts
  // Good
  type Result = { success: true; data: User } | { success: false; error: string }
  // Bad
  type Result = { success: boolean; data?: User; error?: string }
  ```
- **No useless defensive checks.** Verify the type before adding `?.`, `!!`, `&&`-truthiness, or null guards. If the type guarantees non-null/non-empty, drop the check. Example: `perms: PermissionWithLabel[]` → use `perms.length > 0`, not `perms && perms.length > 0`.
- **Ternary at the return.** When a function returns one of two branches based on a boolean, prefer a single `return cond ? A : B` over `if (cond) return A; return B;`.

## Environment variables

- **Never use `process.env` directly** — always use the validated config objects.
- Server-side: `import { serverConfig } from '@/server/config'` → `serverConfig.MY_VAR`
- Client-side: `import { clientConfig } from '@/client-config'` → `clientConfig.myVar`
- When adding a new variable: add it to `serverConfigSchema` in `src/server/config.ts` (or the client config), AND to `.env.example`.
- Both configs use Zod validation — bypassing them loses type safety and runtime validation.

## Error handling patterns

- Services throw `TRPCError` with appropriate codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`.
- Client code wraps async calls with `toastErrors()` helper for automatic error display.
- Never swallow exceptions. Never expose raw DB errors to client.
- Log errors server-side with contextualized logger (no PII in logs).

## Comment conventions

- No comments for self-explanatory code.
- `// TODO:` for planned work.
- `// HACK:` for workarounds (explain why + when to remove).
- No commented-out code — delete it.
- No JSDoc except on complex public utility functions.

## AI communication style

- Never present multiple contradictory options that go back and forth. Think through all tradeoffs internally first, then deliver ONE clear, definitive recommendation.
- If there are genuine tradeoffs the user needs to weigh, present them as a clean comparison — not a narrative that contradicts itself paragraph by paragraph.
- No "actually wait", no "let me reconsider", no live stream of internal deliberation.

## Pre-commit checklist

Always run before committing:
```bash
pnpm lint    # Biome checks
pnpm ts      # TypeScript type check
pnpm test    # Run relevant tests
```
