# tRPC v11 Best Practices and Implementation Analysis

## Executive Summary

Based on the latest tRPC v11 documentation and community practices, your existing implementation using `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@trpc/next`, `superjson`, and custom middleware is largely still current. However, there are several recommended updates and modern patterns you should consider.

## 1. Current tRPC v11 Setup Patterns with Next.js

### Recommended Architecture
- **Package Requirements**: TypeScript >=5.7.2, Node.js 18+
- **Core Packages**: `@trpc/server@^11`, `@trpc/client@^11`, `@trpc/react-query@^11`, `@trpc/next@^11`
- **React Query**: Upgrade to `@tanstack/react-query@^5` (breaking changes)

### Next.js Integration
```typescript
// Modern v11 setup
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
```

### Key Changes from v10
- **Transformers**: Move from client initialization to links configuration
- **React Query v5**: Replace `isLoading` with `isPending`
- **API Renaming**: `createTRPCProxyClient` → `createTRPCClient`
- **Content-Type Checks**: Explicit validation for POST requests

## 2. Modern Context Creation Patterns

### Recommended Context Structure
```typescript
// Two-tier context approach (Inner + Outer)
export async function createContext(opts: CreateNextContextOptions) {
  // Inner context (database connections, static resources)
  const inner = await createInnerContext();
  
  // Outer context (request-specific data)
  const session = await getSession({ req: opts.req });
  
  return {
    ...inner,
    session,
    user: session?.user || null,
  };
}

// Type-safe context
export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Best Practices
- Use "Inner and Outer" context pattern for better separation
- Include authentication state, database connections, and request metadata
- Ensure type safety throughout context chain
- Implement context caching for performance

## 3. Authentication and Authorization Patterns

### Modern Middleware Approach
```typescript
// Authentication middleware
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Must be logged in',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user, // Type-safe user context
    },
  });
});

// Role-based authorization
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.roles?.includes('admin')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next();
});

// Protected procedures
export const protectedProcedure = publicProcedure.use(isAuthenticated);
export const adminProcedure = protectedProcedure.use(isAdmin);
```

### Comparison with trpc-shield
- **trpc-shield**: Still viable but less actively maintained
- **Modern Approach**: Custom middleware with better TypeScript integration
- **Alternatives**: CASL for complex authorization needs, custom middleware for simpler cases
- **Resource-Level**: Use database queries with `ownerId` patterns

### Your Implementation Assessment
✅ **Keep**: Custom context with sessions, roles, permissions
✅ **Keep**: Cookie-based session management
⚠️ **Consider**: Replace trpc-shield with custom middleware for better v11 compatibility

## 4. Client Setup Patterns

### Modern httpBatchLink Configuration
```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson, // Move transformer here in v11
      headers: async () => {
        return {
          authorization: getAuthToken(),
        };
      },
      // New v11 options
      maxURLLength: 2083,
      maxBatchSize: 10,
    }),
  ],
});
```

### Breaking Changes in Client Setup
- **Transformer Location**: Moved from client to link configuration
- **Batch Configuration**: Enhanced with `maxURLLength` and `maxBatchSize`
- **Custom Headers**: Improved async header support

### Your Implementation Assessment
✅ **Keep**: httpBatchLink with custom headers
⚠️ **Update**: Move superjson to link configuration
✅ **Keep**: Batch processing approach

## 5. Data Transformers and Error Handling

### SuperJSON Configuration (v11 Pattern)
```typescript
// Server
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Client (in link configuration)
httpBatchLink({
  url: '/api/trpc',
  transformer: superjson, // New location in v11
})
```

### Enhanced Error Handling
```typescript
// Global error handling
export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Procedure-level error handling
export const safeProcedure = publicProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Enhanced error logging and transformation
    console.error('Procedure error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      cause: error,
    });
  }
});
```

### Your Implementation Assessment
✅ **Keep**: SuperJSON for data transformation
⚠️ **Update**: Move transformer configuration to links
✅ **Enhance**: Add structured error formatting

## 6. New v11 Features to Consider

### Server-Sent Events (SSE)
```typescript
// Enable SSE subscriptions
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  experimental: {
    sse: true, // Moved from experimental.sseSubscriptions
  },
});
```

### Non-JSON Content Types
```typescript
// Support for FormData, Blob, File, Uint8Array
export const uploadProcedure = publicProcedure
  .input(z.instanceof(FormData))
  .mutation(async ({ input }) => {
    // Handle file uploads directly
    const file = input.get('file') as File;
    return { success: true, filename: file.name };
  });
```

### HTTP Method Override
```typescript
// Force POST for all requests
httpBatchLink({
  url: '/api/trpc',
  methodOverride: 'POST', // Useful for URL length limitations
})
```

## Migration Recommendations

### Immediate Actions Required
1. **Upgrade Dependencies**:
   ```bash
   npm install @trpc/server@^11 @trpc/client@^11 @trpc/react-query@^11 @trpc/next@^11 @tanstack/react-query@^5
   ```

2. **Update Transformer Configuration**:
   - Move `superjson` from client creation to `httpBatchLink`

3. **React Query Migration**:
   - Replace `isLoading` with `isPending`
   - Follow TanStack Query v5 migration guide

### Recommended Improvements
1. **Replace trpc-shield**: Implement custom middleware for better v11 compatibility
2. **Enhanced Error Handling**: Add structured error formatting
3. **Context Optimization**: Implement inner/outer context pattern
4. **TypeScript**: Ensure >=5.7.2 for best v11 support

### Optional Enhancements
1. **SSE Support**: For real-time features
2. **Non-JSON Content**: For file uploads
3. **Connection Recovery**: For better reliability
4. **Retry Logic**: Using new retryLink

## Assessment of Your Current Implementation

### ✅ Strengths (Keep These)
- **Architecture**: Sound tRPC setup with proper separation
- **Authentication**: Custom context with sessions works well
- **Data Transformation**: SuperJSON is still recommended
- **Client Setup**: httpBatchLink with custom headers is current
- **Session Management**: Cookie-based approach is still valid

### ⚠️ Areas for Update
- **Dependencies**: Upgrade to v11 packages
- **Transformer Config**: Move superjson to link configuration
- **React Query**: Upgrade to v5 and update loading states
- **trpc-shield**: Consider migration to custom middleware

### 🆕 Opportunities for Enhancement
- **Error Handling**: Implement structured error formatting
- **Context Pattern**: Adopt inner/outer context approach
- **Performance**: Utilize new batch configuration options
- **Features**: Consider SSE for real-time functionality

## Conclusion

Your existing tRPC implementation is fundamentally sound and follows many current best practices. The migration to v11 is largely backward-compatible but requires dependency updates and some configuration changes. The most significant decision is whether to migrate from trpc-shield to custom middleware - while trpc-shield still works, custom middleware provides better TypeScript integration and is more aligned with the v11 approach.

The recommended migration path is:
1. Upgrade dependencies and fix breaking changes
2. Gradually implement recommended patterns
3. Consider new v11 features based on your specific needs
4. Evaluate trpc-shield replacement as a future enhancement