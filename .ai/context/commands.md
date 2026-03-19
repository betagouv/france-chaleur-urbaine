# Commands

## Development

```bash
pnpm dev                         # Start dev server (http://localhost:3000)
pnpm build                       # Production build
PORT=3000 pnpm start             # Start production server (after build)
docker compose up -d             # Start local services (PostgreSQL, Mailpit)
docker compose stop              # Stop local services
```

## Linting (Biome + TypeScript)

```bash
pnpm lint                        # Biome lint check
pnpm lint:fix                    # Biome auto-fix
pnpm ts                          # TypeScript type check
```

## Testing (Vitest)

```bash
pnpm test                        # Run all tests (unit + integration)
pnpm test path/to/file.spec.ts   # Run specific test file
pnpm test:watch                  # Watch mode
pnpm test:coverage               # Run with coverage report
```

Unit tests (`.spec.ts`) run in parallel. Integration tests (`.integration.spec.ts`) run sequentially.

## Database

```bash
pnpm db:migrate                  # Apply pending Kysely migrations
pnpm db:migrate:down             # Rollback last migration
pnpm db:sync                     # Regenerate Kysely types from DB (kysely-codegen)
pnpm db:sync --single            # Regenerate only for a specific table after migration
pnpm db:bootstrap                # Initialize local DB from production data
```

**Migration workflow:**
1. Create migration file in `src/server/db/migrations/` (format: `YYYYMMDDHHMMSS_description.ts`)
2. Run `pnpm db:migrate`
3. Run `pnpm db:sync` to update Kysely types
4. Commit migration + updated types together

## CLI utility

```bash
pnpm cli                                                 # Show available CLI commands
pnpm cli users:add <email> <password> <role> [networks]  # Create user
pnpm start:clock                                         # Start job processor (crons + jobs processor)
```

User roles for `users:add`: `admin`, `professionnel`, `particulier`, `gestionnaire`.
For gestionnaires, pass comma-separated network IDs as 4th argument.


## Email development

```bash
# Mailpit UI at http://localhost:8025 (started via docker compose)
# SMTP on port 1025
```

React Email templates are in `src/modules/email/`.
