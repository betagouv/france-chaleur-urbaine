# Testing

> Load before writing the first test. Runner: **Vitest 4** (happy-dom). Config `vitest.config.mts` = two projects: `unit` (parallel) + `integration` (sequential).

## Kinds & layout
- **Unit** `.spec.ts` — services, utils, validators (parallel).
- **Integration** `.integration.spec.ts` — tRPC routes against a real DB (sequential).
- Component tests with Testing Library (limited). No E2E (Playwright is accessibility-only).
- Colocate tests next to source. Helpers in `src/tests/`: `trpc-helpers.ts` (`createTestCaller`, `testUsers`, `TestCase`, `TestCaseBoolean`, `forbiddenError`) and `setup-mocks.ts`.

## Rules
- Arrange-Act-Assert, descriptive `it` names. Always cover the basic case.
- **`toStrictEqual`** — never `toBe` for objects, never `toBeDefined`. Assert the **whole** result, not individual properties.
- Test authorization for every tRPC route / API endpoint (per role).
- Inline `createTestCaller(user)` per test — never share caller instances. Centralize seed data, don't duplicate fixtures.
- Same function + different inputs → **`it.each` with `TestCase`**; permission matrices → **`TestCaseBoolean` + `forEach`** (labels auto-generated). Don't hand-write near-duplicate `it`s.
- Deterministic UUIDs via `uuid(n)` from `@/tests/helpers` — never hardcode UUID strings.

```ts
const cases: TestCase<string, number>[] = [
  ['empty → 0', '', 0],
  ['one word → 1', 'hello', 1],
];
it.each(cases)('%s', (_, input, expected) => expect(countWords(input)).toStrictEqual(expected));
```

## DB & PostGIS
- Integration tests hit a separate Postgres (port 5433, docker-compose); migrate with `pnpm test:db:migrate`. Isolation via transactions / per-test cleanup.
- Geometry in tests: `sql\`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)\``. Reference point: Paris `{ lat: 48.8566, lon: 2.3522 }`.

## Test vs don't test
- **Test**: service business logic (edge cases, calculations), authorization rules, data transforms + spatial queries, Zod edge cases.
- **Skip**: framework behavior (routing), third-party internals, trivial pass-throughs, styled-components rendering.
