## Testing

**Framework**: Vitest 3 + Testing Library + happy-dom

## Commands

```bash
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test src/utils/file.spec.ts  # Single test
```

## Test File Naming

- `*.spec.ts` - Unit tests for utilities, services
- `*.test.ts` - Integration tests for APIs

## Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('functionName', () => {
  it('should handle expected case', () => {
    expect(functionName(input)).toBe(expected);
  });
});
```

## Coverage Rules

- **MUST**: Critical services, utilities, APIs
- **MUST**: Complex business logic
- **OPTIONAL**: Simple CRUD operations
- **SKIP**: React components (unless complex logic)

## Setup

Mock setup in `src/tests/setup-mocks.ts`, auto-loaded by Vitest config.

