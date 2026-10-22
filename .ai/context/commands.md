# Commands

## Development
```bash
pnpm dev                 # Dev server (http://localhost:3000)
pnpm build               # Production build
PORT=3000 pnpm start     # Production server (after build)
docker compose up -d     # Local services (PostgreSQL, Mailpit)
```

## Quality (run before committing)
```bash
pnpm lint    # Biome check (pnpm lint:fix to auto-fix)
pnpm ts      # TypeScript check
pnpm test    # All tests (pnpm test <file>, pnpm test:watch, pnpm test:coverage)
```
Unit tests (`.spec.ts`) run in parallel; integration tests (`.integration.spec.ts`) run in parallel, one cloned database per worker (see `testing.md`).

## Database
```bash
pnpm db:migrate          # Apply pending Kysely migrations (add `--ignore-missing` to skip migrations applied in DB but absent from the code, e.g. branch behind a shared DB)
pnpm db:migrate:down     # Rollback last migration
pnpm cli db:sync --single <table>   # Print the regenerated Kysely interface of one table, to merge by hand into database.ts (never `pnpm db:sync` alone, see database.md)
pnpm db:bootstrap        # Init local DB from production data, by bundle (fcu, fcu-volumineux, geo, tiles, externes-volumineux) then optionally table by table; `--bundle fcu` skips the prompts
pnpm cli db:anonymize    # Pseudonymize personal data in the LOCAL db right after bootstrap (refuses remote hosts); non-admin accounts become <role>-<id>@fcu.local, admins and passwords untouched
```
Migration workflow: add `src/server/db/migrations/YYYYMMDDHHMMSS_description.ts` → `pnpm db:migrate` → `pnpm cli db:sync --single <table>` and merge the printed interface into `database.ts` by hand (the file keeps manual refinements: TS enums, `JSONColumnType<…>`) → commit migration + types together. A migration that creates a table must also register it in `src/modules/app/commands/db-bootstrap.ts` (right bundle, FK-aware position).

## Backup
```bash
pnpm backup:prod                 # Encrypted (age) off-Scalingo copy of production (DB backup, env vars, Grist, git bundle) — see scripts/backup/README.md
pnpm backup:decrypt <src> <dest> # Verify checksums and decrypt a backup folder (secret key prompted)
```

## CLI & jobs
```bash
pnpm cli                                                 # List CLI commands
pnpm cli users:add <email> <password> <role> [networks]  # role: admin|professionnel|particulier|gestionnaire; networks = CSV ids for gestionnaire
pnpm start:clock                                         # Job processor (crons + jobs)
pnpm cli openapi:generate                                    # Regenerate public/openapi-schema.yaml from zod (partner-api). Run after editing the contract.
pnpm cli data arrete-dpe:html-to-csv <page.html> <out.csv>   # Extract the arrêté DPE annex (saved Légifrance page) to a CSV to version in src/data/arrete-dpe/
pnpm cli data import arrete-dpe --file <csv> [--dry-run]     # Apply regulatory values (CO2, EnR&R, reference year) to networks, then regenerate tiles. Runbook: docs/import_arrete_dpe.md
```

## Email
React Email templates in `src/modules/email/`. Mailpit UI at http://localhost:8025 (SMTP :1025), started via docker compose.
