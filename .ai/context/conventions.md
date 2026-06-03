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
- **One exported component per file.** Never co-locate multiple exported components in the same file — split into separate files named after each component (PascalCase, matches the component name).
- **Always define a `<ComponentName>Props` type** for each component above its declaration. Never inline the props type in the function signature: `function Foo({ x }: { x: string })` → use `type FooProps = { x: string }; function Foo({ x }: FooProps)`.
- **Never name a type `Props` (or any short / generic name)** — even when there is only one type in the file, it must be prefixed by the component / function name (`FooProps`, not `Props`). Same rule for params types (`FooParams`, not `Params`).
- Place the props/params type definition immediately above the function/component that uses it, with no other definitions in between.
- Add a short multi-line TSDoc comment above each React component describing its purpose (1-3 content lines):
- No `forwardRef` unless absolutely necessary.
- Guard clauses for early returns instead of nested `if/else`.
- Explicit names over abbreviations (`networkIdentifier` not `netId`).
- **Never use single-letter or shortened variable names** (`r`, `n`, `el`, `ev`, `idx`, `tmp`, `acc`). Always spell the role: `reminder`, `network`, `element`, `event`, `index`, `temp`, `accumulator`. Applies to parameters, callbacks (`map`/`filter`/`reduce`), and local variables — no exceptions for short scopes.
- **Don't destructure to read just a few properties** — access them directly (`lastEligibility.distance`, `lastEligibility.type`), not `const { distance, type } = lastEligibility`. Destructuring is reserved for React components in general (props).
- **Any `for` loop is a smell** — first try a functional pipeline (`map`/`filter`/`reduce`/`flatMap`/`Set`/`Object.fromEntries`). Each step names one operation, intent reads top-to-bottom. Keep the loop only when the pipeline would force multiple passes on a hot path, or when early-exit (`break`) is the natural shape.

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
- **Ternary at the return.** Any function (or callback, or `useMemo`) whose body is `if (cond) { return A; } return B;` must be rewritten as `return cond ? A : B;`. Applies to nested cases too — chain ternaries rather than stacking `if`/`return` pairs.
- **One statement per line.** Never put two statements on the same line. In particular, never put an `if`/`else`/`for`/`while` and another statement (return, assignment, call) on the same line — always break the body onto its own indented line, even for single-statement bodies.
- **Avoid casts.** Casts (`as Foo`) are a smell — they bypass the type checker. Before adding one, check whether an existing typed helper (browse `src/utils/`), `satisfies`, a discriminated union, or a generic can produce the right type. Casts are acceptable only for narrow, justified cases (e.g. an unavoidable external boundary).
- **Rely on inference.** Never annotate the type of a local `const`/`let`, a hook result (`useMemo`, `useState`, `useCallback`), or an internal helper's return when TypeScript already infers it correctly. Annotate only at boundaries (exported functions, public props, public types) or when inference is ambiguous/expensive. Redundant annotations add noise and obscure when an annotation actually carries intent.

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

- **Comment the "why", not the "what".** Explain non-obvious rationale, trade-offs, gotchas or edge cases — never restate what the code already says.
- **Keep inline comments to one line.** Even a justified "why" comment must be terse — name the constraint, not the full explanation. If it can't fit on one line, the detail belongs in a TSDoc header or a doc file, not inline. Prefer a trailing `// …` on the line it explains.
- **Don't narrate trivial statements** — a comment before *every* line is noise. But the non-obvious still gets one: in particular **a `useEffect` almost always takes a one-line comment** saying what it does/syncs and why.
- No comments for self-explanatory code.
- `// TODO:` for planned work.
- `// HACK:` for workarounds (explain why + when to remove).
- No commented-out code — delete it.
- TSDoc header (purpose, 1-3 lines) above functions, hooks and React components — see *Function and component patterns*. The rules above target inline comments, not these doc headers.

## HTTP calls to external APIs

Never use raw `fetch`. Use helpers from `@/utils/network`:
- `postFetchJSON / putFetchJSON / patchFetchJSON / deleteFetchJSON(url, body?, headers?)` for mutation methods
- `fetchJSON(url, init?)` for GET — pass `headers` inside `init`

They handle `Content-Type: application/json`, JSON parsing, and throw `FetchError` on non-OK responses.
