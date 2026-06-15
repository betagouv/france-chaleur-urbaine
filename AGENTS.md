# AGENTS.md — AI documentation index

> Root index for AI agents. Detailed docs live in `.ai/context/`; load the relevant one before working on an area.

## Workflow

- Re-evaluate which `.ai/context/` files to load on every message **and at each phase** — implement / test / debug / refactor have different triggers.
- Ambiguous request → ask before guessing (unless speed is requested → take the simplest interpretation).
- Code changes: minor (typo, rename, one-liner) → do it directly; significant (feature, refactor, multi-file) → plan → confirm → implement.
- Before delivering any code change: run `pnpm lint`, `pnpm ts`, `pnpm test` (if relevant), and check IDE Tailwind diagnostics on touched files — fix everything first.
- Update the relevant `AGENTS.md` / `.ai/context/*.md` when a change alters a module's high-level behavior or integration points (high-level only).
- Deliver with a 4-5 sentence overview, then one line per file changed.
- Before proposing: is it the minimal solution? Does it duplicate or reintroduce something? Would a senior reviewer object?

## Developer profile

- Senior dev in a small team; wants a critical pair programmer, not a yes-man.
- Direct, factual, no filler. Respond in French; code and docs in English.
- Ship-ready on first delivery: zero TS errors, zero lint warnings, minimum viable solution — no over-engineering.
- Flag doubts, race conditions and limitations *before* implementing. No unsolicited changes to surrounding code.
- Deliver one definitive recommendation — no contradictory back-and-forth, no live "let me reconsider" deliberation.

## Feedback storage

Persistent feedback (coding rules, conventions, project decisions) goes in the project docs: this file for cross-cutting rules, the relevant `.ai/context/*.md` otherwise. Never in personal memory (user/session only).

## Context files index

Load before working on the related area.

| File | Load when… |
|------|------------|
| [api-patterns.md](.ai/context/api-patterns.md) | Client↔server data exchange: new/changed endpoints, queries, mutations |
| [architecture.md](.ai/context/architecture.md) | Adding/moving files, creating modules, understanding structure |
| [commands.md](.ai/context/commands.md) | Running lint, typecheck, build, tests, DB migrations, CLI |
| [conventions.md](.ai/context/conventions.md) | Writing or reviewing any code — naming, imports, types, errors, language |
| [database.md](.ai/context/database.md) | Anything DB: queries, tables, migrations, Kysely, PostGIS |
| [deployment.md](.ai/context/deployment.md) | Scalingo, CI/CD, environments, env vars, monitoring |
| [domain.md](.ai/context/domain.md) | Project purpose, business rules, glossary, roles, workflows |
| [git-workflow.md](.ai/context/git-workflow.md) | Commits, branches, PRs, protected files |
| [maps.md](.ai/context/maps.md) | Vector tiles pipeline (generate/serve/cache), geo data. **Client map rendering → `src/modules/map/AGENTS.md`** |
| [nextjs-patterns.md](.ai/context/nextjs-patterns.md) | Pages, routing, data fetching, client↔server patterns |
| [security.md](.ai/context/security.md) | Auth, roles, permissions, input validation, headers |
| [stack.md](.ai/context/stack.md) | Choosing a library, checking versions, upgrading deps |
| [state-management.md](.ai/context/state-management.md) | React state, forms, URL params (`nuqs`), Jotai, React Query |
| [styling.md](.ai/context/styling.md) | Any UI `.tsx`: Tailwind, DSFR, responsive, icons |
| [testing.md](.ai/context/testing.md) | Writing/modifying/running any test — load BEFORE the first test |

## Code navigation

Prefer LSP over Grep/Glob: `goToDefinition` / `findReferences` before renaming or changing a signature, `hover` for types, `workspaceSymbol` to locate, `getDiagnostics` after writing. Grep/Glob only for comments, string literals, config values.

## Module docs

Modules under `src/modules/` may ship their own `AGENTS.md` — read it before editing or importing from that module (`glob src/modules/*/AGENTS.md`).
