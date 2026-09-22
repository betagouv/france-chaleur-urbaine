# Git Workflow

- **Repo**: https://github.com/betagouv/france-chaleur-urbaine
- **Branches**: `main` = production, `dev` = integration (default). Feature branches off `dev`.

## Flow
1. Branch from `dev`.
2. Open PR → Scalingo spawns a review app (reuses dev DB, no migrations).
3. CI runs (`.github/workflows/ci.yml`: audit blocking on critical vulnerabilities, lint, types, migrations, tests, build). Actions are pinned by SHA; `.github/dependabot.yml` opens npm security-update PRs as soon as a fix exists (no routine version bumps, majors are upgraded by hand) and one grouped monthly PR for the action SHAs.
4. Merge PR → `dev` auto-deploys to staging.
5. Production: fast-forward `dev` → `main` → auto-deploys.

Branch names: descriptive, no prefix convention. Commits: no strict format — explain the **why**, not the what.

## Protected files
- **Never commit**: `.env.local`, credentials, API keys (GitGuardian pre-commit via `.gitguardian.yaml`).
- **Review carefully**: `src/server/db/migrations/`, `package.json`, CI config.
- **Auto-generated (don't edit)**: `pnpm-lock.yaml`, `src/server/db/kysely/database.ts` (from `pnpm db:sync`).
