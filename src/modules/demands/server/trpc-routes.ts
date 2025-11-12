import { route, router } from '@/modules/trpc/server';

import { zAddRelanceCommentInput, zAdminUpdateDemandInput, zUpdateDemandInput } from '../constants';
import * as demandsService from './demands-service';

export const demandsRouter = router({
  addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input }) => {
    const { relanceId, comment } = input;
    return await demandsService.updateCommentFromRelanceId(relanceId, comment);
  }),
  admin: {
    list: route.meta({ auth: { roles: ['admin'] } }).query(async () => {
      const result = await demandsService.listAdmin();
      return result;
    }),
    update: route.input(zAdminUpdateDemandInput).mutation(async ({ input }) => {
      const { demandId, values } = input;
      return await demandsService.update(
        demandId,
        values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/
      );
    }),
  },
  list: route.meta({ auth: { roles: ['gestionnaire', 'demo'] } }).query(async ({ ctx }) => {
    return await demandsService.list(ctx.user);
  }),
  update: route.input(zUpdateDemandInput).mutation(async ({ input }) => {
    const { demandId, values } = input;
    return await demandsService.update(
      demandId,
      values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/
    );
  }),
});
