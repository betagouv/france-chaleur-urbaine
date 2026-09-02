# PAC MI

Small public API integration for the `france-chaleur-urbaine-pac` frontend prototype.

## Structure

- `constants.ts` owns API schemas and shared types.
- `server/simulation-service.ts` maps validated API input to the publicodes engine and returns normalized numbers.
- `server/tracking-service.ts` relays whitelisted anonymous widget events to PostHog.

## Boundaries

- This module exposes calculation and anonymous tracking relay logic only. It must not read/write the database.
- Publicodes rule names stay encapsulated in the service; callers use the API schema from `constants.ts`.
- Public REST routes live in `src/pages/api/pac/` because they are consumed by a separate frontend repository.
- Tracking accepts only declared `simulateur_pac:*` events and bounded non-PII properties; do not add free-form analytics payloads.

## Public API

`POST /api/pac/simulation`

Input: address metadata, DPE, household size, MaPrimeRénov income category, surface.

Output: PAC air/water proposed power, gross/net PAC price, MaPrimeRénov' and Coup de pouce aid amounts, annual energy bills, and heating mode comparisons with P1 and CO2 values.

`POST /api/pac/income-options`

Input: department code and household size.

Output: MaPrimeRénov' income categories with numeric min/max bounds. The frontend owns user-facing label formatting.

`POST /api/pac/events`

Input: anonymous visitor id, one whitelisted `simulateur_pac:*` event name, and sanitized context properties.

Output: tracking relay status. PostHog errors are swallowed so the embedded simulator never breaks on analytics failures.
