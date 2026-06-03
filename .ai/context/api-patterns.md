# API Patterns

## Strategy
- **All new endpoints = tRPC.** No new REST routes in `src/pages/api/` (legacy — migrate, don't extend).
- Exceptions that stay REST: public API (`/api/v1/`, OpenAPI), webhooks (signature-verified), file downloads, NextAuth.

## tRPC routes (`src/modules/<domain>/server/trpc-routes.ts`)
```ts
export const demandsRouter = router({
  getById: routeRole(['admin', 'gestionnaire'])
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => demandsService.getById(input.id, ctx.userId)),
  create: routeRole(['professionnel', 'particulier'])
    .input(zCreateDemand)
    .mutation(({ input, ctx }) => demandsService.create(input, ctx.userId)),
});
```
- Zod input schemas live in the module `constants.ts`. Auth via `routeRole([...])`. `query` reads, `mutation` writes.
- **Business logic in service functions, never inline in routes.**

## Context (`ctx` in every procedure)
`ctx.user` / `ctx.userId` (or null), `ctx.hasRole(role)`, `ctx.isAuthenticated`, `ctx.logger` (contextualized Winston).

## Client
tRPC hooks (`trpc.<router>.<proc>.useQuery/useMutation`). Wrap mutation calls in `toastErrors(...)` for automatic error notifications. Cache/invalidation: see state-management.md.

## Errors
Throw `TRPCError`: `BAD_REQUEST` (400, validation), `UNAUTHORIZED` (401, not logged in), `FORBIDDEN` (403, role/permission), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500). Never expose stack traces or raw DB errors; log full detail server-side via `ctx.logger`. The client receives a structured error (with Zod details).

## Rate limiting
`src/modules/security/` (`express-rate-limit`), applied per-route via tRPC middleware; stricter on auth endpoints.

## Public REST API
OpenAPI spec `public/openapi-schema.yaml` (registered on data.gouv.fr). Only two endpoints — `GET /api/v1/eligibility` (test an address) and `GET /api/v1/networks` (download geometries). Everything else goes through tRPC.

## Third-party calls
Wrap each in a dedicated service file (never call from components), keys via env config. Integrations are listed in domain.md.
