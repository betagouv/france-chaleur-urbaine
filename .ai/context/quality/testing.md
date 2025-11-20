# Testing Guidelines

This project uses **Vitest 4** with **Testing Library** and **happy-dom** for all tests. Follow these guidelines for consistent and maintainable test code.

## Core Principles

1. **Declarative over imperative** - Use data-driven tests with `it.each()` or `.forEach()`
2. **DRY (Don't Repeat Yourself)** - Extract test data into a declarative arrays
3. **Type-safe** - Use TypeScript types for test cases
4. **Clear labels** - Test descriptions should clearly indicate what is being tested

## Test Helpers

All test helpers are in `src/tests/trpc-helpers.ts`:

```typescript
import type { TestCase, TestCaseBoolean } from '@/tests/trpc-helpers';
import { createTestCaller, testUsers, forbiddenError } from '@/tests/trpc-helpers';
```

### Available Types

**`TestCase<TInput, TExpectedOutput>`** - Generic test case with label:
```typescript
type TestCase<TInput = any, TExpectedOutput = any> = {
  label: string;
  input: TInput;
  expectedOutput: TExpectedOutput;
};
```

**`TestCaseBoolean<TInput>`** - Simplified for boolean validation (no label):
```typescript
type TestCaseBoolean<TInput = any> = {
  input: TInput;
  expectedOutput: boolean;
};
```

## Testing Patterns

### Pattern 1: Unit Tests with `it.each()` (static labels)

Use when test cases have unique, predefined labels.

```typescript
import { describe, expect, it } from 'vitest';
import type { TestCase } from '@/tests/trpc-helpers';

describe('myFunction()', () => {
  const testCases: TestCase<string, number>[] = [
    { input: 'hello', expectedOutput: 5, label: 'returns length of string' },
    { input: '', expectedOutput: 0, label: 'returns 0 for empty string' },
    { input: 'test', expectedOutput: 4, label: 'handles normal cases' },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(myFunction(input)).toBe(expectedOutput);
  });
});
```

**Reference**: `src/utils/validation.spec.ts` - Example with multiple validation scenarios

### Pattern 2: Unit Tests with `.forEach()` (dynamic labels)

Use when labels should be auto-generated from test data.

```typescript
import { describe, expect, it } from 'vitest';
import type { TestCaseBoolean } from '@/tests/trpc-helpers';

describe('validate()', () => {
  const testCases: TestCaseBoolean<string>[] = [
    { input: 'valid@email.com', expectedOutput: true },
    { input: 'invalid', expectedOutput: false },
    { input: '', expectedOutput: false },
  ];

  testCases.forEach(({ input, expectedOutput }) => {
    it(expectedOutput ? `accepte "${input}"` : `rejette "${input}"`, () => {
      expect(validate(input)).toBe(expectedOutput);
    });
  });
});
```

**Reference**: `src/modules/demands/constants.validation.spec.ts:70-89` - Phone validation example

### Pattern 3: Integration Tests (TRPC routes)

Use for testing API routes with permissions.

```typescript
import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('myRouter', () => {
  describe('myRoute', () => {
    const testCases: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(testCases)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.myNamespace.myRoute();

      if (allowed) {
        await expect(callRoute()).resolves.toMatchObject({ /* expected result */ });
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });
  });
});
```

**Reference**: `src/modules/jobs/server/trpc-routes.integration.spec.ts` - Complete permission test example

## Naming Conventions

### Test Files
- `*.spec.ts` - Unit tests for utilities, services (e.g., `validation.spec.ts`)
- `*.integration.spec.ts` - Integration tests using database (e.g., `trpc-routes.integration.spec.ts`)
- `*.test.ts` - Legacy integration tests for APIs (being migrated to `*.integration.spec.ts`)

### Test Variables
- Use `testCases` as the default variable name for test data arrays
- Use specific prefixes when multiple arrays exist in same scope:
  - `validTestCases` / `invalidTestCases`
  - `edgeCaseTests`

### Test Descriptions
- Use French for user-facing functionality tests
- Use English for technical/utility function tests
- Be explicit: "accepte X", "rejette Y", "retourne Z"

## Best Practices

### ✅ Do

```typescript
// Extract test cases data with typed data from test logic
const testCases: TestCase<Input, Output>[] = [
  { input: 'test', expectedOutput: true, label: 'handles normal case' },
];

// Explicit error expectations
await expect(fn).rejects.toMatchObject({ code: 'NOT_FOUND' });

// Use helpers for common patterns
const caller = createTestCaller(testUsers.admin);
```

### ❌ Don't

```typescript
// Don't repeat test logic manually
it('test 1', () => { expect(fn('a')).toBe(true); });
it('test 2', () => { expect(fn('b')).toBe(true); });
it('test 3', () => { expect(fn('c')).toBe(true); });

// Don't use generic labels
it('works', () => { /* ... */ });

// Don't mix test data with test logic
it('validates email', () => {
  expect(validate('test@example.com')).toBe(true);
  expect(validate('invalid')).toBe(false);
  // ... more inline assertions
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific file
pnpm test src/path/to/file.spec.ts

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Test Setup

Mock setup is configured in `src/tests/setup-mocks.ts` and automatically loaded by Vitest config.

## Coverage Guidelines

Write tests based on these priorities:

- **MUST test**: 
  - Critical services and utilities
  - Complex business logic
  - API routes with permissions
  - Data validation and transformations

- **OPTIONAL**: 
  - Simple CRUD operations
  - Straightforward utility functions

- **SKIP**: 
  - React components (unless they contain complex logic)
  - Simple getters/setters

## Creating New Tests

1. Create file: 
   - `myFeature.spec.ts` for unit tests
   - `myFeature.integration.spec.ts` for integration tests using the database
2. Import test helpers: `import type { TestCase } from '@/tests/trpc-helpers';`
3. Define test data array: `const testCases: TestCase<Input, Output>[] = [...]`
4. Use `it.each()` or `.forEach()` pattern
5. Run tests: `pnpm test`
