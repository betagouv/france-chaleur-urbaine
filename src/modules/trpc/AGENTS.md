# tRPC Module

Ready-to-use tRPC v11 module with authentication, middleware system, and API documentation panel.

## Quick Installation

### 1. Install Dependencies
```bash
# Install dependencies
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next superjson zod
pnpm add -D trpc-ui

# Create api

mkdir -p src/pages/api/trpc/[trpc].ts
echo "export { default } from '@/modules/trpc/server/api';" > src/pages/api/trpc/[trpc].ts
echo "export { default } from '@/modules/trpc/server/api-panel';" > src/pages/api/trpc/inde.ts

```

### 2. Integrate with _app.tsx
```typescript
import { trpc } from '@/modules/trpc/client';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default trpc.withTRPC(MyApp);
```

### 4. Ready to Use! 🎉
- **API Panel**: http://localhost:3000/api/trpc
- **Health Check**: `curl "http://localhost:3000/api/trpc/healthCheck"`

## Usage

- All routes has to be defined in `src/modules/trpc/server/routes.ts`
- Context is created on france-chaleur-urbaine/src/modules/trpc/server/context.ts

### Create new routes on server

When using trpc in an existing or newly created module

1. Create validation schema in `src/modules/<moduleName>/constants.ts` as it will be used on server and client

2. Create a `src/modules/<moduleName>/server/trpc-routes.ts` with the following

```ts
import { z } from 'zod';

import { zCreateModuleNameInput, zUpdateModuleNameInput } from '@/modules/pro-eligibility-tests/constants';
import { route, router, routeRole } from '@/modules/trpc/server';

import * as moduleNamesService from './service';

const authRoute = routeRole(['admin', 'gestionnaire']);
const adminRoute = routeRole(['admin']);

export const moduleNamesRouter = router({
  create: route.input(zCreateModuleNameInput).mutation(async ({ input, ctx }) => {
    return await moduleNamesService.create(input, ctx);
  }),
  update: route.input(zUpdateModuleNameInput).mutation(async ({ input, ctx }) => {
    return await moduleNamesService.update(input.id, input, {}, ctx);
  }),
  list: authRoute.query(async ({ ctx }) => {
    return await moduleNamesService.list({}, ctx);
  }),
  get: authRoute.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return await moduleNamesService.get(input.id, {}, ctx);
  }),
  delete: authRoute.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    return await moduleNamesService.remove(input.id, {}, ctx);
  }),
});
```

3. Add it to `src/modules/trpc/server/routes.ts`

```ts
import { moduleNameRouter } from '@/modules/moduleName/server/trpc-routes';

import { route, router } from './connection';

/**
 * This is the primary router for your server.
 *
 * All routers added in /modules/trpc/routers should be manually added here.
 */
export const appRouter = router({
  // Health check endpoint - no auth required
  healthCheck: route.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'tRPC server is running!',
    };
  }),
  moduleName: moduleNameRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
```

### Use routes on frontend

```ts
import trpc, { type RouterOutput } from '@/modules/trpc/client';

const { data: testDetails, isLoading, refetch } = trpc.moduleName.get.useQuery({ id: test.id }, { enabled: viewDetail });
```

## Rate Limiting

tRPC routes can be protected with rate limiting via the `security` module. Rate limiting is configured per-route using the `meta` property.

**See the full [Security Module documentation](../security/CLAUDE.md) for details.**

### Quick Example

Add rate limiting to any route using `.meta()`:

```typescript
export const contactRouter = router({
  create: route
    .meta({
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 1,
        message: "Vous ne pouvez envoyer qu'un message par minute",
      },
    })
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      return await createContact(input);
    }),
});
```

### Rate Limit Configuration

The `rateLimit` meta property accepts:

```typescript
{
  windowMs?: number;    // Time window in milliseconds (default: 15 minutes)
  max?: number;         // Maximum requests per window (default: 20)
  message?: string;     // Custom error message for TRPCError
}
```

**Note**: Le paramètre `path` est automatiquement ajouté par le middleware et ne doit pas être spécifié dans la config.

### Common Patterns

- **Contact forms**: 1 request/minute (strict anti-spam)
- **Search/List endpoints**: 100 requests/minute
- **Auth endpoints**: 5 attempts/15 minutes
- **Upload endpoints**: 10 uploads/hour

**Note**: If no `rateLimit` is specified in meta, no rate limiting is applied to the route.

### Implementation Details

Rate limiting uses `express-rate-limit` from the security module:

- **Shared Store**: Un `MemoryStore` global partagé entre toutes les routes
- **Isolation**: Clés préfixées par `path:ip` pour isoler les compteurs par route
- **IPv6 Support**: Utilise `ipKeyGenerator` pour support IPv6
- **Automatic**: Le middleware lit automatiquement `meta.rateLimit` et applique les limites

Le middleware tRPC (`src/modules/trpc/server/middlewares/rate-limit.ts`) :
1. Vérifie si `meta.rateLimit` est défini
2. Crée un rate limiter avec `createRateLimiter({ ...config, path })`
3. Le path tRPC est automatiquement ajouté pour isoler les compteurs
4. Rejette avec `TRPCError` code `TOO_MANY_REQUESTS` si limite atteinte

### Type Safety

Le type `Meta['rateLimit']` est défini dans `src/modules/trpc/server/context.ts`:

```typescript
{
  rateLimit?: Omit<RateLimiterOptions, 'path'> & { message?: string };
}
```

Le type exclut automatiquement `path` (géré par le middleware) et ajoute le champ optionnel `message` pour personnaliser l'erreur.

### Invalidate queries or update cache

Based on the situation, if new data has been received, 2 options can be used:

- Invalidate queries
```ts
  const utils = trpc.useUtils();

  void utils.moduleName.list.invalidate();
  void utils.moduleName.get.invalidate({ id: testId });
```

- Update cache

```ts
  // Update the get cache if it exists for this test
  utils.moduleName.get.setData({ id: testId }, (oldData) => {
    if (oldData) {
      return { ...oldData, name: updatedTest.name };
    }
    return oldData;
  });

  // Update the list cache to reflect the renamed test
  utils.moduleName.list.setData(undefined, (oldData) => {
    if (oldData) {
      return {
        ...oldData,
        items: oldData.items.map((item) => (item.id === testId ? { ...item, name: updatedTest.name } : item)),
      };
    }
    return oldData;
  });
```
