## Backend (API & TRPC)

## API Strategy

- **Preferred**: TRPC routes in modules (`module/server/trpc-routes.ts`)
- **Legacy**: REST in `src/pages/api/*` (migrate to TRPC when touching)
- **Pattern**: Business logic in `module/server/service.ts`, NOT in API routes

## Architecture

- **Separation**: `server/` (Node, DB, services) vs `client/` (React)
- **Modules**: See `.ai/context/required/modules.md` for structure
- **Database**: See `.ai/context/backend/database.md` for Kysely patterns

## Error Handling

See `.ai/context/quality/errors.md` for error patterns.

## Business Logic

- Keep API routes thin (validation, auth, call service)
- Put business logic in service layer (`module/server/service.ts`)
- Services are reusable across different API endpoints
- Services are easier to test in isolation
