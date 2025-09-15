import { zUpdateReseauInput } from '@/modules/reseaux/constants';
import { router, routeRole } from '@/modules/trpc/server';

import * as reseauxService from './service';

const adminRoute = routeRole(['admin']);

export const reseauxRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.list();
  }),
  updateTags: adminRoute.input(zUpdateReseauInput).mutation(async ({ input }) => {
    return await reseauxService.updateTags(input.id, input.tags);
  }),
});
