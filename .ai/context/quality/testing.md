## Testing

**Framework**: Vitest 3 + Testing Library + happy-dom  
**Strategy**: Progressive testing (project started without tests)

## Commands

```bash
pnpm test                        # Run all tests
pnpm test:watch                  # Watch mode
pnpm test src/utils/core.spec.ts  # Single test
```

## File Naming

- `*.spec.ts` - Unit tests (utils, pure functions)
- `*.test.ts` - Integration tests (APIs, database)

## 1. Unit Tests (Pure Functions)

**Priority**: Utility functions with logic (no external dependencies)

```typescript
import { describe, expect, it } from 'vitest';

describe('functionName', () => {
  it('should handle main case', () => {
    expect(functionName(input)).toBe(expected);
  });
  
  it.each([
    { input: 'a', expected: 'A' },
    { input: 'b', expected: 'B' },
  ])('should uppercase $input', ({ input, expected }) => {
    expect(uppercase(input)).toBe(expected);
  });
  
  // Test error cases if relevant
  it('should throw on invalid input', () => {
    expect(() => functionName(null)).toThrow();
  });
});
```

## 2. API Tests (TRPC/REST)

**Priority**: New TRPC routes for security  
**Strategy**: Seed DB, don't mock it

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { mockUserSession, uuid } from '@/tests/helpers';

describe('API /admin/endpoint', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTableUser([
      { id: uuid(1), role: 'admin' },
      { id: uuid(2), role: 'particulier' },
    ]);
  });

  it.each([
    { user: null, expectedStatus: 401 },
    { user: { id: uuid(2), role: 'particulier' }, expectedStatus: 403 },
    { user: { id: uuid(1), role: 'admin' }, expectedStatus: 200 },
  ])('should return $expectedStatus for user', async ({ user, expectedStatus }) => {
    const { req, res } = createMocks({ method: 'GET' });
    mockUserSession(user);

    await handler(req, res);
    
    expect(res.statusCode).toBe(expectedStatus);
  });
});
```

## 3. Component Tests (UI)

**Priority**: Complex components with logic  
**Library**: Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MyComponent', () => {
  it('should render with text', () => {
    render(<MyComponent text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Utilities

**Fixtures** (`src/tests/fixtures.ts`):
- `cleanDatabase()` - Reset DB
- `seedTableUser()`, `seedTableX()` - Seed tables
- **Add fixtures as needed** for new tests

**Helpers** (`src/tests/helpers.ts`):
- `mockUserSession(user)` - Mock auth
- `uuid(n)` - Deterministic UUIDs

**Mocks** (`src/tests/setup-mocks.ts`):
- Auto-loaded via Vitest config
- Mocks `@/server/config`, `next/router`

## Coverage Strategy

**Progressive approach**: Better one basic test than no test

**Prioritize**:
1. **Utils with logic** - Pure functions (parsers, validators)
2. **New TRPC routes** - Security (auth, permissions)
3. **Complex UI** - Components with logic

**Optional**:
- Services (CRUD)
- Simple components

**Skip**:
- Type definitions
- Trivial functions

## Best Practices

- **One test > no test** - Don't aim for 100% coverage immediately
- **Seed DB, don't mock** - Real database for API tests
- **Test error cases** when relevant
- Use `describe` for grouping
- Use `it.each` for multiple similar cases
- **Extend fixtures** as needed (`src/tests/fixtures.ts`)
