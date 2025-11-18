import { route, router } from '@/modules/trpc/server';

import {
  zAddRelanceCommentInput,
  zAdminUpdateDemandInput,
  zCreateDemandInput,
  zGestionnaireUpdateDemandInput,
  zListEmailsInput,
  zSendEmailInput,
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
    listEmails: route
      .meta({ auth: { roles: ['gestionnaire', 'admin'] } })
      .input(zListEmailsInput)
      .query(async ({ input }) => {
        return await demandsService.listEmails(input.demand_id);
      }),
    sendEmail: route
      .meta({ auth: { roles: ['gestionnaire', 'admin'] } })
      .input(zSendEmailInput)
      .mutation(async ({ input, ctx }) => {
        await demandsService.sendEmail({
          demand_id: input.demand_id,
          emailContent: input.emailContent,
          key: input.key,
          user: ctx.user,
        });
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
