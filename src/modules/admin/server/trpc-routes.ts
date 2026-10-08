import { adminRoute, router } from '@/modules/trpc/server';

import { getAdminDashboardIndicators } from './service';

export const adminRouter = router({
  /** Counters of the items waiting for the FCU team (admin dashboard). */
  getDashboardIndicators: adminRoute.query(() => getAdminDashboardIndicators()),
});
