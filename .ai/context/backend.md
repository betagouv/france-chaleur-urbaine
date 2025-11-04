## Backend (API & TRPC)

## API Strategy

- **Preferred**: TRPC routes in modules (`module/server/trpc-routes.ts`)
- **Legacy**: REST in `src/pages/api/*` (migrate to TRPC when touching)
- **Pattern**: Business logic in `module/server/service.ts`, NOT in API routes

## Error Handling

See `.ai/context/errors.md` for error patterns.

## Logging

```typescript
import { logger } from '@/server/helpers/logger';

logger.info('message', { context });
logger.error('error', { error, userId });
```

Rules: contextual, minimal, no PII.

## Architecture

- **Separation**: `server/` (Node, DB, services) vs `client/` (React)
- **Modules**: See `.ai/context/modules.md` for structure
- **Database**: See `.ai/context/database.md` for Kysely patterns

## Testing

- Add vitest tests for critical services, utilities, APIs
- See `.ai/context/testing.md` for patterns
