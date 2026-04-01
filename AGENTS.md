# AGENTS.md - AI documentation index

> Root index for AI agents. Detailed docs live in `.ai/context/`. Read them when working on related areas.

## AI Agent workflow

For every user message:
- read AGENTS.md (this file) to decide which context files in `.ai/context/` are worth loading for this specific message — some messages need none, others need several. Re-evaluate on every message as the conversation evolves.
- **re-evaluate context at each phase of the task** — implementing code, writing tests, debugging, refactoring are different phases with their own triggers. Don't bundle them: re-check the index when switching phase, even mid-message.
- if the request is ambiguous, ask clarifying questions before proceeding (prefer asking over guessing, unless the user asks for speed — in that case, pick the simplest/fastest interpretation)
- **for tasks involving code modifications** (writing, editing, deleting, moving files):
  - **minor changes** (typo, rename, single-line fix): implement directly, no plan needed
  - **significant changes** (new feature, refactor, multi-file edit): create a plan → ask user to confirm → implement
  - **after implementation**: run `pnpm lint`, check IDE Tailwind CSS extension diagnostics on modified files (canonical classes, unknown utilities — not caught by Biome), run `pnpm ts`, and `pnpm test` if relevant — fix any errors before delivering
  - print a summary: start with a high-level overview (4-5 sentences max: what was done and why), then list main files modified/created with a one-liner per file

## Developer profile

- **Role**: Senior developer in a small team maintaining this project.
- **Expects**: A critical pair programmer, not a compliant assistant.
- **Style**: Direct, factual, no filler — communicate like a seasoned teammate.
- **Language**: Respond in French, code and docs in English.
- Ship-ready code on first delivery: zero TS errors, zero lint warnings.
- No over-engineering — minimum viable solution only.
- Proactively flag doubts, race conditions, or limitations before implementing.
- No unsolicited changes to surrounding code.

## Feedback storage

When the user gives feedback that should persist (coding rules, conventions, project decisions), **always** record it in the project: this `AGENTS.md` for cross-cutting rules, or the relevant file in `.ai/context/` (e.g. `conventions.md` for code style). **Never** store project feedback in personal memory — memory is for user/session context, not project knowledge that the whole team should share.

## Context files index

Load these files **before** working on the related area. When in doubt, load the file.

| File | Load when… |
|------|------------|
| [api-patterns.md](.ai/context/api-patterns.md) | Any client↔server data exchange: new endpoints, new queries/mutations, modifying existing ones |
| [architecture.md](.ai/context/architecture.md) | Adding/moving files, creating modules, understanding project structure |
| [commands.md](.ai/context/commands.md) | Running lint, typecheck, build, tests, DB migrations, CLI scripts |
| [conventions.md](.ai/context/conventions.md) | Writing or reviewing any code — naming, imports, types, error handling, language rules |
| [database.md](.ai/context/database.md) | Touching anything DB: queries, tables, migrations, Kysely, PostGIS |
| [deployment.md](.ai/context/deployment.md) | Scalingo, CI/CD, environments, env vars, monitoring |
| [domain.md](.ai/context/domain.md) | Understanding the project, business rules, glossary, user roles, workflows |
| [git-workflow.md](.ai/context/git-workflow.md) | Commits, branches, PRs, protected files |
| [maps.md](.ai/context/maps.md) | Carte interactive: layers, tuiles, MapConfiguration, MapLibre, données géographiques |
| [nextjs-patterns.md](.ai/context/nextjs-patterns.md) | Pages, routing, `_app.tsx`, `getServerSideProps`, data fetching, client↔server communication patterns |
| [security.md](.ai/context/security.md) | Auth, roles, permissions, input validation, env vars, headers |
| [stack.md](.ai/context/stack.md) | Choosing a library, checking versions, upgrading dependencies |
| [state-management.md](.ai/context/state-management.md) | React state, forms, URL params (`nuqs`), Jotai, React Query |
| [styling.md](.ai/context/styling.md) | Any `.tsx` with UI: Tailwind, DSFR, responsive, icons, className |
| [testing.md](.ai/context/testing.md) | Writing, modifying or running ANY test (`.spec.ts` / `.integration.spec.ts`) — load BEFORE writing the first test |

## Code navigation

Prefer LSP over Grep/Glob:
- `goToDefinition` / `findReferences` before renaming or changing a signature.
- `hover` for type info without reading the file.
- `workspaceSymbol` to locate a symbol across the workspace.
- `getDiagnostics` after every code write.
- Use Grep/Glob only for: comments, string literals, config values.

## Critical thinking before proposing

Before proposing any solution:
1. Is this the minimal solution? If not, simplify.
2. Does it reintroduce a previously identified problem?
3. Is there redundancy with what already exists?
4. Would a senior peer reviewer find flaws?

Think critically first, code second. One good question beats three iterations.

## Module-level docs

Each module in `src/modules/` may have its own `AGENTS.md`. Read it when editing files in or importing from that module. Use `glob src/modules/*/AGENTS.md` to discover which modules have one.
