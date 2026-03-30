# Testing

## Testing strategy

- **Unit tests** (`.spec.ts`): services, utilities, validators. Run in parallel.
- **Integration tests** (`.integration.spec.ts`): tRPC routes with real DB. Run sequentially.
- **Component tests**: critical UI components with Testing Library (limited usage).
- **No E2E tests** currently (Playwright is only configured for accessibility).

## Framework

- **Vitest 4** with happy-dom environment.
- Config: `vitest.config.mts` — two projects: `unit` (parallel) + `integration` (sequential).
- Coverage: v8 provider, HTML/lcov/text reports.

## File organization

Tests colocated next to source files:
```
src/modules/demands/server/
  demands-service.ts
  demands-service.spec.ts              # Unit test
  demands-service.integration.spec.ts  # Integration test
  trpc-routes.integration.spec.ts      # tRPC route test
```

Test utilities: `src/tests/`
- `trpc-helpers.ts` — `createTestCaller`, `testUsers`, `TestCase`, `TestCaseBoolean`, `forbiddenError`.
- `setup-mocks.ts` — global mocks.

## Writing tests

Follow Arrange-Act-Assert (AAA) pattern. Use descriptive `it` names.

```ts
describe('DemandsService.create', () => {
  it('creates a demand with correct status', async () => {
    // Arrange
    const input = { email: 'test@example.com', address: '1 rue de Paris' };

    // Act
    const demand = await demandsService.create(input);

    // Assert
    expect(demand).toStrictEqual({
      id: expect.any(Number),
      status: 'pending',
      address: '1 rue de Paris',
      created_at: expect.any(String)
    });
  });
});
```

**Key rules:**
- Always test the most basic case
- Test user permissions for API and TRPC endpoints
- Use `toStrictEqual` (not `toBe` for objects, not `toBeDefined`).
- Validate the entire result instead of specific properties
- Centralize seed data — don't duplicate test fixtures.
- Inline `createTestCaller` — don't share caller instances between tests.
- Use `it.each` with `TestCase` type for parameterized tests:

```ts
const cases: TestCase<string, number>[] = [
  ['empty string returns 0', '', 0],
  ['single word returns 1', 'hello', 1],
];
it.each(cases)('%s', (_, input, expected) => {
  expect(countWords(input)).toStrictEqual(expected);
});
```

- Use `TestCaseBoolean` + `forEach` for permission tests (labels auto-generated from input):
```ts
const adminOnlyPermissions: TestCaseBoolean<Partial<User> | null>[] = [
  { input: null, expectedOutput: false },
  { input: testUsers.particulier, expectedOutput: false },
  { input: testUsers.gestionnaire, expectedOutput: false },
  { input: testUsers.admin, expectedOutput: true },
];

function testPermissions(
  permissions: TestCaseBoolean<Partial<User> | null>[],
  callRoute: (user: Partial<User> | null) => () => Promise<unknown>
) {
  permissions.forEach(({ input: user, expectedOutput: allowed }) => {
    const role = user?.role ?? 'non authentifié';
    const label = allowed ? `autorise ${role}` : `refuse ${role}`;
    it(label, async () => {
      if (allowed) {
        await expect(callRoute(user)()).resolves.toBeDefined();
      } else {
        await expect(callRoute(user)).rejects.toMatchObject(forbiddenError);
      }
    });
  });
}

describe('permissions', () => {
  testPermissions(adminOnlyPermissions, (user) => () => createTestCaller(user).demands.admin.list());
});
```

## Integration testing (tRPC)

Use `createTestCaller` from `src/tests/trpc-helpers.ts`:

```ts
import { createTestCaller, testUsers } from '@/tests/trpc-helpers';

describe('demands tRPC routes', () => {
  it('admin can list all demands', async () => {
    const caller = createTestCaller(testUsers.admin);
    const result = await caller.demands.getAll();
    expect(result).toBeDefined();
  });

  it('anonymous user is forbidden', async () => {
    const caller = createTestCaller(null);
    await expect(caller.demands.getAll()).rejects.toThrow(forbiddenError);
  });
});
```

Test users available: `testUsers.admin`, `testUsers.gestionnaire`, `testUsers.professionnel`, `testUsers.particulier`.

## Test UUIDs

Use `uuid(n)` from `@/tests/helpers` to generate deterministic v4 UUIDs in tests. Never hardcode UUID strings.

```ts
import { uuid } from '@/tests/helpers';

uuid(100) // '00000000-0000-4000-8000-000000000100'
uuid(200) // '00000000-0000-4000-8000-000000000200'
```

## Test database

- Integration tests use a separate PostgreSQL instance (port 5433 via docker-compose).
- Test DB migrations are run with `pnpm test:db:migrate`
- Each test suite uses transactions for isolation or test-specific cleanup.

## PostGIS in tests

Reference coordinates for testing:
```ts
// Paris center (approximate)
const PARIS = { lat: 48.8566, lon: 2.3522 };

// Helper for PostGIS geometry
function pointGeometry(lon: number, lat: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;
}
```

## What to test vs what not to test

**Test:**
- Business logic in services (edge cases, validation, calculations).
- Authorization rules (role-based access per tRPC route).
- Data transformations and spatial queries.
- Zod schema validation (edge cases).

**Don't test:**
- Next.js routing (framework behavior).
- Third-party library internals.
- Simple pass-through functions.
- Styled-components rendering.

## Running tests

```bash
pnpm test                        # All tests
pnpm test path/to/file.spec.ts   # Specific file
pnpm test:watch                  # Watch mode
pnpm test:coverage               # Coverage report
```
