# PAC MI

Small public API integration for the `france-chaleur-urbaine-pac` frontend prototype.

## Structure

- `constants.ts` owns API schemas and shared types.
- `server/simulation-service.ts` maps validated API input to the publicodes engine and returns normalized numbers.

## Boundaries

- This module exposes calculation logic only. It must not read/write the database.
- Publicodes rule names stay encapsulated in the service; callers use the API schema from `constants.ts`.
- The public REST route lives in `src/pages/api/pac/simulation.ts` because it is consumed by a separate frontend repository.

## Public API

`POST /api/pac/simulation`

Input: address metadata, DPE, household size, MaPrimeRénov income category, surface.

Output: PAC air/water proposed power, gross/net PAC price, annual energy bills, and heating mode comparisons with P1 and CO2 values.
