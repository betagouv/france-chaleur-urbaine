# tRPC Module

Ready-to-use tRPC v11 module with authentication, middleware system, and API documentation panel.

## Quick Installation

### 1. Install Dependencies
```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next superjson zod trpc-ui
```

### 2. Add API Routes
Create these files in your Next.js project:

**`/src/pages/api/trpc/[trpc].ts`** (Main tRPC handler):
```typescript
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/modules/trpc/server/routes';
import { createContext } from '@/modules/trpc/server/context';

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
```

**`/src/pages/api/trpc/index.ts`** (API Documentation Panel):
```typescript
export { default } from '@/modules/trpc/server/api-panel';
```

### 3. Integrate with _app.tsx
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

## Features

- ✅ **tRPC v11** with Pages Router integration
- ✅ **Authentication system** with `.auth()` decorator pattern
- ✅ **Role-based authorization** using FCU's existing auth system
- ✅ **Extensible middleware system**
- ✅ **Interactive API documentation panel**
- ✅ **Type-safe procedures** with full TypeScript support

## Usage

### Basic Queries
```typescript
// In React components
const { data } = trpc.healthCheck.useQuery();
const { data } = trpc.public.useQuery({ message: "Hello!" });
```

### Authenticated Queries
```typescript
// Using the .auth() decorator
const { data } = trpc.me.useQuery(); // Requires authentication
const { data } = trpc.adminStats.useQuery(); // Requires admin role
```

### Mutations
```typescript
const mutation = trpc.echo.useMutation({
  onSuccess: (data) => console.log(data.echo),
});

mutation.mutate({ message: "Hello tRPC!" });
```

## Adding New Routes

**In `/src/modules/trpc/server/routes.ts`**:
```typescript
export const appRouter = router({
  // Public endpoint
  myRoute: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return { result: input.id };
    }),

  // Protected endpoint with auth decorator
  myAuthRoute: authProcedure
    .auth({ authenticated: true, roles: ['admin'] })
    .query(({ ctx }) => {
      return { user: ctx.user };
    }),
});
```

## Available Endpoints

📖 **Interactive API Documentation**: http://localhost:3000/api/trpc

## Architecture

```
src/modules/trpc/
├── server/
│   ├── connection.ts      # Core tRPC setup + auth middleware
│   ├── context.ts         # Context using FCU's existing auth
│   ├── routes.ts          # Main app router with example routes
│   ├── api.ts             # Next.js API handler
│   ├── api-panel.ts       # API documentation panel
│   ├── utils.ts           # Utility functions
│   └── middlewares/       # Extensible middleware system
│       └── auth.ts        # Authentication middleware
├── client.ts              # tRPC client configuration
├── server.ts              # Server-side exports
└── types.ts               # TypeScript definitions
```

## Middleware System

Extensible middleware architecture in `/server/middlewares/`:
- **Auth middleware**: Authentication and role checking
- **Custom middlewares**: Easy to add and compose

Create new middlewares by following the pattern in `/middlewares/auth.ts`.

## Development

- **Start server**: `pnpm dev`
- **API Documentation**: http://localhost:3000/api/trpc
- **Health Check**: http://localhost:3000/api/trpc/healthCheck
- **TypeScript Check**: `pnpm ts`
