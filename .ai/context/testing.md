# Testing

> Load before writing the first test. Runner: **Vitest 5** (happy-dom 21 — its `Animation.cancel()` rejects `finished` without marking it handled, so motion exit animations would surface unhandled `AbortError`s; `src/tests/setup-mocks.ts` patches `Animation.prototype.cancel` as a HACK, drop it once happy-dom #2339 / #2412 is fixed). Config `vitest.config.mts` = two projects: `unit` (parallel, happy-dom) + `integration` (parallel, node env, one database per worker).

## Kinds & layout
- **Unit** `.spec.ts` — services, utils, validators (parallel).
- **Integration** `.integration.spec.ts` — tRPC routes against a real DB (parallel, one database per worker).
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
- Parallelism: `src/tests/integration-global-setup.ts` clones the migrated test DB (`fcu_test`, the template) into `fcu_test_1..N` (N = `maxWorkers`, min(8, CPUs)) on every run; `src/tests/integration-setup.ts` points each worker's `DATABASE_URL` at its clone and runs `cleanDatabase()` before every file, so no file depends on what the template or a previous file left. Files inside a worker run one at a time. Clones are kept after the run to inspect a failure. The clone fails fast if a session is connected to `fcu_test` (close psql / DB clients). Two `pnpm test` runs against the same Postgres at once are not supported.
- Limits: `maxWorkers` × `DATABASE_POOL_MAX` (10 in tests, mocked in `setup-mocks.ts`) must stay under Postgres `max_connections` (100). `maxWorkers` is shared by both projects on purpose: per-project `maxWorkers` requires a `sequence.groupOrder`, and Vitest 5.0.1 then reuses a `VITEST_POOL_ID` still in use when switching groups (two files on one database).
- Geometry in tests: `sql\`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)\``. Reference point: Paris `{ lat: 48.8566, lon: 2.3522 }`.

## Test vs don't test
- **Test**: service business logic (edge cases, calculations), authorization rules, data transforms + spatial queries, Zod edge cases.
- **Skip**: framework behavior (routing), third-party internals, trivial pass-throughs, styled-components rendering.
