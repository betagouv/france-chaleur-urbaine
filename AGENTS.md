# AGENTS.md - AI documentation index

> Root index for AI agents. Detailed docs live in `.ai/context/`. Read them when working on related areas.

## AI Agent workflow

For every user message:
- start every response with "Agent FCU au rapport !"
- read AGENTS.md (this file) to decide which context files in `.ai/context/` are worth loading for this specific request — some requests need none, others need several
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
| [testing.md](.ai/context/testing.md) | Writing or running tests, adding endpoints, fixing bugs |

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

Each module in `src/modules/` may have its own `AGENTS.md`. Read it when editing files in or importing from that module.

26 modules: `analytics`, `app`, `auth`, `ban`, `bdnb`, `chaleur-renouvelable`, `config`, `data`, `demands`, `diagnostic`, `email`, `events`, `form`, `geo`, `jobs`, `notification`, `opendata`, `optimization`, `permissions`, `pro-eligibility-tests`, `reseaux`, `security`, `tags`, `tiles`, `trpc`, `users`.
