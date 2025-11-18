import { routeRole, router } from '@/modules/trpc/server';

import * as demandsService from './service';
import * as tagsStatsService from './tags-stats-service';

const adminRoute = routeRole(['admin']);

export const demandsLegacyRouter = router({
  getReseauxDemandesStats: adminRoute.query(async () => {
    return await demandsService.getReseauxDemandesStats();
  }),
  getTagsStats: adminRoute.query(async () => {
    return await tagsStatsService.getTagsStats();
  }),
});
