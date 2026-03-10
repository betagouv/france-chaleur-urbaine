# API Patterns

## API strategy

- **Rule: all new endpoints = tRPC. No new REST routes in `src/pages/api/`.**
- **Internal mutations + queries:** tRPC (type-safe, end-to-end).
- **External consumers:** REST Route Handlers at `/api/v1/` (OpenAPI documented).
- **Webhooks:** REST Route Handlers with signature verification.
- **Legacy REST routes:** `src/pages/api/` — do NOT extend, migrate to tRPC.

## tRPC route conventions

Location: `src/modules/<domain>/server/trpc-routes.ts`

```ts
import { router } from '@/modules/trpc/server/connection';
import { routeRole } from '@/modules/trpc/server/connection';

export const demandsRouter = router({
  // Query (read)
  getById: routeRole(['admin', 'gestionnaire'])
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return demandsService.getById(input.id, ctx.userId);
    }),

  // Mutation (write)
  create: routeRole(['professionnel', 'particulier'])
    .input(zCreateDemand)
    .mutation(async ({ input, ctx }) => {
      return demandsService.create(input, ctx.userId);
    }),
});
```

**Patterns:**
- Input validation always with Zod schemas (defined in module `constants.ts`).
- Auth via `routeRole()` middleware (restrict by user role list).
- Business logic delegated to service functions — never inline in routes.
- Use `query` for reads, `mutation` for writes.

## tRPC context

Available in every procedure via `ctx`:
- `ctx.user` — full user object (or null).
- `ctx.userId` — user ID string (or null).
- `ctx.hasRole(role)` — check if user has a specific role.
- `ctx.isAuthenticated` — boolean.
- `ctx.logger` — contextualized Winston logger.

## tRPC client usage

```tsx
import { trpc } from '@/modules/trpc/client/next';

// Query
const { data, isLoading } = trpc.reseaux.getAll.useQuery(
  { filters },
  { enabled: !!filters, refetchInterval: 30_000 }
);

// Mutation
const createMutation = trpc.demands.create.useMutation({
  onSuccess: () => {
    utils.demands.getAll.invalidate(); // Invalidate cache
  },
});
```

Wrap mutation calls with `toastErrors()` for automatic error notifications:
```ts
await toastErrors(async () => {
  await createMutation.mutateAsync(data);
});
```

## Cache management

See [state-management.md](state-management.md) for cache invalidation, optimistic updates, and React Query defaults.

## Rate limiting

- Middleware: `src/modules/security/` using `express-rate-limit`.
- Applied per-route via tRPC middleware.
- Stricter limits on auth endpoints.

## Error handling in API

- tRPC routes throw `TRPCError` with codes:
  | Code | HTTP | Usage |
  |------|------|-------|
  | `BAD_REQUEST` | 400 | Validation errors, bad input |
  | `UNAUTHORIZED` | 401 | Not logged in |
  | `FORBIDDEN` | 403 | Insufficient role/permissions |
  | `NOT_FOUND` | 404 | Resource doesn't exist |
  | `INTERNAL_SERVER_ERROR` | 500 | Unexpected errors |
- Never expose stack traces or raw DB errors.
- Log full error details server-side with `ctx.logger`.
- Client receives structured error via tRPC error formatter (includes Zod validation details).

## Public API (REST)

OpenAPI spec: `public/openapi-schema.yaml` (registered on data.gouv.fr).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/eligibility` | GET | Test address eligibility for district heating |
| `/api/v1/networks` | GET | Download heat/cold network geometries |

These are the only public REST endpoints. All other API access goes through tRPC.

## Third-party integrations

| Service | Location | Purpose |
|---------|----------|---------|
| BAN (Base Adresse Nationale) | `src/modules/ban/` | Address geocoding and autocomplete |
| BDNB (Base de Données Nationale des Bâtiments) | `src/modules/bdnb/` | Building data lookup |
| Pipedrive | `src/server/services/` (legacy) | CRM / deal tracking |
| Airtable | `src/server/db/airtable.ts` (legacy) | Legacy CRM data sync |
| Matomo | `src/modules/analytics/` | Web analytics |
| data.gouv.fr | `src/modules/opendata/` | Open data publishing |

Rules:
- Wrap third-party APIs in dedicated service files.
- Store API keys in environment variables.
- Never call third-party APIs directly from components.
