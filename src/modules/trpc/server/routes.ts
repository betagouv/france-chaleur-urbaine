import { appRouter } from '../trpc.config';

export { appRouter };

// Export type definition of API
export type AppRouter = typeof appRouter;
