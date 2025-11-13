import { route, router } from '@/modules/trpc/server';

import {
  zAddRelanceCommentInput,
  zAdminUpdateDemandInput,
  zCreateDemandInput,
  zGestionnaireUpdateDemandInput,
  zUserUpdateDemandInput,
} from '../constants';
import * as demandsService from './demands-service';

export const demandsRouter = router({
  admin: {
    list: route.meta({ auth: { roles: ['admin'] } }).query(async () => {
      const result = await demandsService.listAdmin();
      return result;
    }),
    update: route
      .meta({ auth: { roles: ['admin'] } })
      .input(zAdminUpdateDemandInput)
      .mutation(async ({ input }) => {
        const { demandId, values } = input;
        return await demandsService.update(
          demandId,
          values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/
        );
      }),
  },
  gestionnaire: {
    list: route.meta({ auth: { roles: ['gestionnaire', 'demo'] } }).query(async ({ ctx }) => {
      return await demandsService.list(ctx.user);
    }),
    update: route
      .meta({ auth: { roles: ['gestionnaire', 'demo'] } })
      .input(zGestionnaireUpdateDemandInput)
      .mutation(async ({ input }) => {
        const { demandId, values } = input;
        return await demandsService.update(
          demandId,
          values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/
        );
      }),
  },
  user: {
    addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input }) => {
      const { relanceId, comment } = input;
      return await demandsService.updateCommentFromRelanceId(relanceId, comment);
    }),
    create: route.input(zCreateDemandInput).mutation(async ({ input }) => {
      return await demandsService.create(input);
    }),
    update: route.input(zUserUpdateDemandInput).mutation(async ({ input }) => {
      const { demandId, values } = input;
      return await demandsService.update(demandId, values as any);
    }),
  },
});
