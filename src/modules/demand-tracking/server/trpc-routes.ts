import { businessRules } from '@/modules/app/business-rules';
import { route, router } from '@/modules/trpc/server';

import { zRequestDemandTrackingInput } from '../constants';
import { requestDemandTracking } from './service';

export const demandTrackingRouter = router({
  // The client shows the same confirmation on TOO_MANY_REQUESTS: the cap must not reveal anything either.
  request: route
    .meta({ rateLimit: { limit: businessRules.demandTrackingEmailsPerHour.value, windowMs: 60 * 60 * 1000 } })
    .input(zRequestDemandTrackingInput)
    .mutation(async ({ input }) => {
      await requestDemandTracking(input.email);
    }),
});
