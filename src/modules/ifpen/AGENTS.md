# IFPEN

Small public API integration for the `france-chaleur-urbaine-ifpen` frontend prototype.

## Structure

- `constants.ts` owns API schemas and shared types.
- `server/heating-simulation-service.ts` maps validated API input to the publicodes engine and returns normalized numbers.

## Boundaries

- This module exposes calculation logic only. It must not read/write the database.
- Publicodes rule names stay encapsulated in the service; callers use the API schema from `constants.ts`.
- The public REST route lives in `src/pages/api/ifpen/heating-simulation.ts` because it is consumed by a separate frontend repository.

## Public API

`POST /api/ifpen/heating-simulation`

Input: address metadata, DPE, household size, MaPrimeRénov income category, surface.

Output: PAC air/water proposed power, gross/net PAC price, and annual energy bills for PAC air/water, gas boiler and oil boiler.
