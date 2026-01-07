# Testing Guidelines

This project uses **Vitest 4** with **Testing Library** and **happy-dom** for all tests. Follow these guidelines for consistent and maintainable test code.

## Core Principles

1. **Declarative over imperative** - Use data-driven tests with `it.each()` or `.forEach()`
2. **DRY (Don't Repeat Yourself)** - Extract test data into declarative arrays
3. **Type-safe** - Use TypeScript types for test cases
4. **Clear labels** - Test descriptions should clearly indicate what is being tested
5. **Use `toStrictEqual` with all fields** - Verify complete object structure for maximum non-regression detection
6. **Avoid `toBeDefined()`** - Always verify actual values or use `expect.any(Type)` matchers
7. **Centralize seed data** - Create reusable seed functions with reference coordinates
8. **Inline `createTestCaller`** - Call directly in expect rather than storing in variables

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
      const callRoute = () => createTestCaller(user).myNamespace.myRoute();

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
// Use toStrictEqual to verify ALL fields at once (best for non-regression)
expect(result).toStrictEqual({
  co2: 50,
  distance: expect.any(Number),
  futurNetwork: false,
  gestionnaire: 'CPCU',
  hasNoTraceNetwork: null,
  hasPDP: false,
  id: '7501C',
  inPDP: true,
  isClasse: true,
  isEligible: true,
  name: 'CPCU',
  tauxENRR: 65,
  veryEligibleDistance: expect.any(Number),
});

// Use matchers for dynamic/unpredictable values
expect(result).toStrictEqual({
  createdAt: expect.any(Date),
  id: expect.any(String),
  count: expect.any(Number),
  status: 'active',
});

// Inline createTestCaller directly in the test
const result = await createTestCaller(null).reseaux.eligibilityStatus(testPoint);
expect(result).toStrictEqual({ ... });

// Create reusable seed functions with parallelization
export async function seedNetworksForEligibilityTests() {
  // Parallelize all independent insertions
  await Promise.all([
    seedReseauDeChaleur({ id_fcu: 7501, ... }),
    seedZoneEtReseauEnConstruction({ id_fcu: 9001, ... }),
    // ... all seeds in parallel
  ]);
}

// Use reference coordinates
export const NETWORK_TEST_COORDS = {
  testPoint: { city: 'Paris', lat: 48.8566, lon: 2.3522 },
  reseauTresProche: { lat: 48.8566, lon: 2.35256 },
};

// Extract geometry helpers
export function createLineGeometry(lon: number, lat: number, offsetMeters: number) {
  const offsetDegrees = offsetMeters / 111000;
  return sql`ST_Transform(ST_MakeLine(
    ST_Point(${lon + offsetDegrees}, ${lat}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat + offsetDegrees}, 4326)
  ), 2154)`;
}

// Parallelize independent database operations with Promise.all
export async function cleanDatabase() {
  await Promise.all([
    kdb.deleteFrom('users').execute(),
    kdb.deleteFrom('jobs').execute(),
    kdb.deleteFrom('reseaux_de_chaleur').execute(),
    // ... all independent deletes
  ]);
}

// Explicit error expectations
await expect(fn).rejects.toStrictEqual({ code: 'NOT_FOUND', message: expect.any(String) });
```

### ❌ Don't

```typescript
// Don't use multiple toBe() assertions
expect(result.id).toBe('7501C');
expect(result.name).toBe('CPCU');
expect(result.isEligible).toBe(true);
// Use toStrictEqual with all fields instead ☝️

// Don't use toBeDefined() without checking the actual value
expect(result.id).toBeDefined();
// Use expect.any(String) or actual value instead ☝️

// Don't duplicate geometry creation code
geom: sql`ST_Transform(ST_MakeLine(...), 2154)` // repeated everywhere
// Create a helper function instead ☝️

// Don't repeat seed data in every test
beforeEach(async () => {
  await seedReseauDeChaleur({ ... }); // same data in each test
});
// Create a centralized seed function instead ☝️

// Don't run independent operations sequentially
await kdb.deleteFrom('users').execute();
await kdb.deleteFrom('jobs').execute();
await kdb.deleteFrom('reseaux_de_chaleur').execute();
// Use Promise.all for parallel execution ☝️

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

### Geometry Helpers for PostGIS

Create reusable geometry helpers to avoid SQL duplication:

```typescript
// src/tests/fixtures.ts
/**
 * Creates a LineString geometry (for networks) from coordinates with offset
 * @param lon Longitude in WGS84 (SRID 4326)
 * @param lat Latitude in WGS84 (SRID 4326)
 * @param offsetMeters Distance offset in meters (~111km per degree)
 * @returns SQL expression for LineString in Lambert 93 (SRID 2154)
 */
export function createLineGeometry(
  lon: number, 
  lat: number, 
  offsetMeters: number
): RawBuilder<string> {
  const offsetDegrees = offsetMeters / 111000;
  return sql`ST_Transform(ST_MakeLine(
    ST_Point(${lon + offsetDegrees}, ${lat}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat + offsetDegrees}, 4326)
  ), 2154)`;
}

/**
 * Creates a Polygon geometry (for zones) from center point with radius
 */
export function createPolygonGeometry(
  lon: number,
  lat: number,
  radiusMeters: number
): RawBuilder<string> {
  const offsetDegrees = radiusMeters / 111000;
  return sql`ST_Transform(ST_MakePolygon(ST_MakeLine(ARRAY[
    ST_Point(${lon - offsetDegrees}, ${lat - offsetDegrees}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat - offsetDegrees}, 4326),
    ST_Point(${lon + offsetDegrees}, ${lat + offsetDegrees}, 4326),
    ST_Point(${lon - offsetDegrees}, ${lat + offsetDegrees}, 4326),
    ST_Point(${lon - offsetDegrees}, ${lat - offsetDegrees}, 4326)
  ])), 2154)`;
}
```

**Usage in tests:**

```typescript
beforeEach(async () => {
  await cleanDatabase();
  await seedNetworksForEligibilityTests();
});

it('retourne éligible pour un réseau très proche', async () => {
  const result = await createTestCaller(null).reseaux.eligibilityStatus(
    NETWORK_TEST_COORDS.testPoint // Use reference coordinates
  );

  expect(result).toStrictEqual({
    co2: 50,
    distance: expect.any(Number),
    futurNetwork: false,
    gestionnaire: 'CPCU',
    hasNoTraceNetwork: null,
    hasPDP: false,
    id: '7501C',
    inPDP: true,
    isClasse: true,
    isEligible: true,
    name: 'CPCU',
    tauxENRR: 65,
    veryEligibleDistance: expect.any(Number),
  });
  expect(result.distance).toBeLessThan(60);
});
```

**Reference**: `src/modules/reseaux/server/trpc-routes.eligibilityStatus.integration.spec.ts` - Complete example with seed data and geometry helpers

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
