## Error Handling

## Principles

- **User-friendly messages** - Clear, actionable
- **Never swallow exceptions** without logging
- **No sensitive data** in errors (PII, credentials, tokens)
- **Auto-captured by Sentry** via `toastErrors`

## Server Errors (TRPC)

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'BAD_REQUEST',       // 400
  // or: UNAUTHORIZED,        // 401
  // or: FORBIDDEN,           // 403
  // or: NOT_FOUND,           // 404
  // or: INTERNAL_SERVER_ERROR, // 500
  message: 'Message utilisateur clair',
});
```

**Common codes**:
- `BAD_REQUEST` - Invalid input
- `UNAUTHORIZED` - Not logged in
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found

## Client Error Handling

**Wrap async handlers with `toastErrors`**:

```typescript
import { toastErrors } from '@/modules/notification';

// Basic - shows error toast automatically
const handleSubmit = toastErrors(async (data) => {
  await trpc.items.create.mutate(data);
  notify('success', 'Created!');
});

// With custom error message
const handleSubmit = toastErrors(
  async (data) => {
    await trpc.items.create.mutate(data);
  },
  (err) => `Custom error: ${err.message}`
);
```

**With forms**:
```typescript
const { Form, Submit } = useForm({
  schema: mySchema,
  onSubmit: toastErrors(async ({ value }) => {
    await submitMutation.mutateAsync(value);
  }),
});
```

**What `toastErrors` does**:
1. Executes async function
2. On error: Shows toast notification
3. Captures exception to Sentry
4. Extracts Zod validation errors if present

## Server Logging

```typescript
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ module: 'my-module' });

logger.error('Operation failed', { userId, error });
logger.warn('Deprecated feature used');
logger.info('Operation completed', { duration });
```

**Always use contextualized logger**:
- TRPC routes: `ctx.logger`
- Services: Module-level logger

**Never log**: Passwords, tokens, PII (email, phone, address)  
**Always include**: User ID, resource ID, operation context

## Error Display

**Zod errors** are automatically extracted and shown:
- Form validation errors display per field
- TRPC validation errors show in toast

**Error hierarchy**:
1. Custom error message (via `customError` param)
2. First Zod validation error
3. Error message
4. Stringified error
