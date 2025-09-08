import { proEligibilityTestsRouter } from '@/modules/pro-eligibility-tests/server/trpc-routes';

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
  proEligibilityTests: proEligibilityTestsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
