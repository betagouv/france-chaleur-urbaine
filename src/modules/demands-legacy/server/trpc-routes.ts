import { routeRole, router } from '@/modules/trpc/server';

import * as tagsStatsService from './service';

const adminRoute = routeRole(['admin']);

export const demandsLegacyRouter = router({
  getTagsStats: adminRoute.query(async () => {
    return await tagsStatsService.getTagsStats();
  }),
});
