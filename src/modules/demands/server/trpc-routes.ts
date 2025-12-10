import { route, routeRole, router } from '@/modules/trpc/server';

import {
  zAddRelanceCommentInput,
  zAdminUpdateDemandInput,
  zCreateBatchDemandInput,
  zCreateDemandInput,
  zDeleteDemandInput,
  zGestionnaireUpdateDemandInput,
  zListEmailsInput,
  zSendEmailInput,
  zUserUpdateDemandInput,
} from '../constants';
import * as demandsService from './demands-service';

export const demandsRouter = router({
  admin: {
    delete: routeRole(['admin'])
      .input(zDeleteDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId } = input;
        await demandsService.remove(demandId, ctx.user.id);
      }),
    getTagsStats: routeRole(['admin']).query(async () => demandsService.getTagsStats()),
    list: routeRole(['admin']).query(async () => {
      const result = await demandsService.listAdmin();
      return result;
    }),
    update: routeRole(['admin'])
      .input(zAdminUpdateDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId, values } = input;
        return await demandsService.update(demandId, values, ctx.user.id);
      }),
  },
  gestionnaire: {
    list: routeRole(['gestionnaire', 'demo']).query(async ({ ctx }) => {
      return await demandsService.list(ctx.user);
    }),
    listEmails: routeRole(['gestionnaire', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input, ctx }) => {
        return await demandsService.listEmails({ demandId: input.demand_id, user: ctx.user });
      }),
    sendEmail: routeRole(['gestionnaire', 'admin'])
      .input(zSendEmailInput)
      .mutation(async ({ input, ctx }) => {
        await demandsService.sendEmail({
          demand_id: input.demand_id,
          emailContent: input.emailContent,
          key: input.key,
          user: ctx.user,
        });
      }),
    update: routeRole(['gestionnaire', 'demo'])
      .input(zGestionnaireUpdateDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId, values } = input;
        return await demandsService.update(demandId, values, ctx.user.id);
      }),
  },
  user: {
    addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input, ctx }) => {
      const { relanceId, comment } = input;
      return await demandsService.updateCommentFromRelanceId(relanceId, comment, ctx.user?.id);
    }),
    create: route.input(zCreateDemandInput).mutation(async ({ input, ctx }) => {
      return await demandsService.create(input, { userId: ctx.user?.id });
    }),
    createBatch: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin'])
      .input(zCreateBatchDemandInput)
      .mutation(async ({ input, ctx }) => {
        return await demandsService.createBatch(input, ctx.user.id);
      }),
    list: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin']).query(async ({ ctx }) => {
      return await demandsService.listByUser(ctx.user.id);
    }),
    listEmails: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input, ctx }) => {
        return await demandsService.listEmails({ demandId: input.demand_id, user: ctx.user });
      }),
    update: route.input(zUserUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await demandsService.update(demandId, values as any, ctx.user?.id);
    }),
  },
});
