## Error Handling

## Principles

- **Concise, actionable** error messages
- **Never swallow** exceptions without logging
- **No sensitive data** in error messages (PII, credentials)
- Use **TRPCError** for TRPC routes

## TRPC Errors

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'BAD_REQUEST',  // or UNAUTHORIZED, FORBIDDEN, NOT_FOUND, etc.
  message: 'Message utilisateur clair',
});
```

## Client Error Handling

```typescript
import { toastErrors } from '@/utils/errors';

// Wrap async handlers
const handler = toastErrors(
  async () => {
    await api.call();
  },
  () => <span>Message d'erreur personnalisé</span>
);
```

## Server Logging

```typescript
import { logger } from '@/server/helpers/logger';

logger.error('Operation failed', { context: 'value', error });
logger.warn('Deprecated feature used');
logger.info('Operation completed');
```

**Never log**: passwords, tokens, PII (email, phone, address)
**Always include**: correlation IDs, user ID, resource ID

