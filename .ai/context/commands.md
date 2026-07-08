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
Unit tests (`.spec.ts`) run in parallel; integration tests (`.integration.spec.ts`) run sequentially.

## Database
```bash
pnpm db:migrate          # Apply pending Kysely migrations
pnpm db:migrate:down     # Rollback last migration
pnpm db:sync             # Regenerate Kysely types from DB (--single for one table)
pnpm db:bootstrap        # Init local DB from production data
```
Migration workflow: add `src/server/db/migrations/YYYYMMDDHHMMSS_description.ts` → `pnpm db:migrate` → `pnpm db:sync` → commit migration + regenerated types together.

## CLI & jobs
```bash
pnpm cli                                                 # List CLI commands
pnpm cli users:add <email> <password> <role> [networks]  # role: admin|professionnel|particulier|gestionnaire; networks = CSV ids for gestionnaire
pnpm start:clock                                         # Job processor (crons + jobs)
pnpm cli openapi:generate                                    # Regenerate public/openapi-schema.yaml from zod (partner-api). Run after editing the contract.
pnpm cli demands dedupe [--apply] [--out <file>]         # Dedupe demands by email+address; dry-run writes a CSV, --apply soft-deletes duplicates
```

## Email
React Email templates in `src/modules/email/`. Mailpit UI at http://localhost:8025 (SMTP :1025), started via docker compose.
