import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { appRouter as appModuleRouter } from '@/modules/app/server/trpc-routes';
import { authRouter } from '@/modules/auth/server/trpc-routes';
import { bdnbRouter } from '@/modules/bdnb/server/trpc-routes';
import buildContext from '@/modules/config/server/context-builder';
import { dataRouter } from '@/modules/data/server/trpc-routes';
import { diagnosticRouter } from '@/modules/diagnostic/server/trpc-routes';
import { jobsRouter } from '@/modules/jobs/server/trpc-routes';
import { proEligibilityTestsRouter } from '@/modules/pro-eligibility-tests/server/trpc-routes';
import { reseauxRouter } from '@/modules/reseaux/server/trpc-routes';
import { tilesRouter } from '@/modules/tiles/server/trpc-routes';
import { route, router } from './server/connection';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;
  const baseContext = await buildContext(req, res);

  return {
    ...baseContext,
    req,
    res,
  };
}

/**
 * This is the primary router for your server.
 *
 * All routers added in /modules/[name]/server/trpc-routes.ts should be manually added here.
 */
export const appRouter = router({
  app: appModuleRouter,
  auth: authRouter,
  bdnb: bdnbRouter,
  data: dataRouter,
  diagnostic: diagnosticRouter,
  // Health check endpoint - no auth required
  healthCheck: route.query(() => {
    return {
      message: 'tRPC server is running!',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }),
  jobs: jobsRouter,
  proEligibilityTests: proEligibilityTestsRouter,
  reseaux: reseauxRouter,
  tiles: tilesRouter,
});
