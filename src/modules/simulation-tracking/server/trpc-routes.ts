import { getTrackingRequestContext } from '@/modules/conversion-tracking/server/request-context';
import { adminRoute, route, router } from '@/modules/trpc/server';

import { zCreateSimulation, zGetSimulationFunnel, zRecordSimulationOutcome, zUpdateSimulation } from '../constants';
import { createSimulation, getSimulationFunnel, recordSimulationOutcome, updateSimulation } from './service';

/** Public tracking beacons: same budget as the conversion events (`conversionTracking.recordEvent`). */
const trackingRoute = route.meta({ rateLimit: { limit: 60, windowMs: 60 * 1000 } });

/** First-party tracking of the renewable heating simulations (public beacons, admin funnel). Crawlers are dropped silently. */
export const simulationTrackingRouter = router({
  create: trackingRoute.input(zCreateSimulation).mutation(async ({ input, ctx }) => {
    const requestContext = getTrackingRequestContext(ctx);
    if (requestContext.isBot) {
      return;
    }
    await createSimulation(input, requestContext);
  }),
  getFunnel: adminRoute.input(zGetSimulationFunnel).query(({ input }) => getSimulationFunnel(input)),
  recordOutcome: trackingRoute.input(zRecordSimulationOutcome).mutation(async ({ input, ctx }) => {
    if (getTrackingRequestContext(ctx).isBot) {
      return;
    }
    await recordSimulationOutcome(input);
  }),
  update: trackingRoute.input(zUpdateSimulation).mutation(async ({ input, ctx }) => {
    if (getTrackingRequestContext(ctx).isBot) {
      return;
    }
    await updateSimulation(input);
  }),
});
