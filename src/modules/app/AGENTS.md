# app module

App-wide constants and helpers that belong to no single business domain. This is the home for cross-cutting values shared across many modules.

## Structure

- `business-rules.ts` — **single source of truth for the numeric business thresholds and delays** (eligibility distances, relance delays, permission cap, upload size…). Client-safe (no imports). See the contract below.
- `constants.ts` — `dataSourcesVersions`: provenance (version, link, date) of the external datasets used across the app (BDNB, FEDENE, DPE, SDES…).
- `types.ts` — shared app-level types.
- `client/hooks/useUserInfo.tsx` — user info hook.
- `commands.ts` — CLI commands under the `app` namespace.

## `business-rules.ts` contract (important)

- A number belongs in `businessRules` **only if its production definition reads it from there** — that is what makes the code and the admin documentation provably equal (the doc renders the same entries via `<Rule id="…" />`, `src/modules/doc/client/Rule.tsx`).
- Read a threshold **inline** in the code that uses it (`businessRules.x.value`), not through an optional parameter with a default — an optional param that no caller ever overrides is dead flexibility.
- When you change a number, change it in `business-rules.ts` only; the code and the documentation follow.
- `doc-coverage.spec.ts` guards part of this (every `<Rule id>` in the docs must reference a real key).

## Boundaries

- Owns no DB table and no tRPC route. Pure shared values/helpers.
- Keep it client-safe: no `@/server` or Kysely imports here (both client and server code depend on it).
