import { routeAuthenticated, routeRole, router } from '@/modules/trpc/server';

import {
  zAddRelanceCommentInput,
  zAdminUpdateDemandInput,
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
    list: routeRole(['admin']).query(async () => {
      const result = await demandsService.listAdmin();
      return result;
    }),
    update: routeRole(['admin'])
      .input(zAdminUpdateDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId, values } = input;
        return await demandsService.update(
          demandId,
          values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/,
          ctx.user.id
        );
      }),
  },
  gestionnaire: {
    list: routeRole(['gestionnaire', 'demo']).query(async ({ ctx }) => {
      return await demandsService.list(ctx.user);
    }),
    listEmails: routeRole(['gestionnaire', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input }) => {
        return await demandsService.listEmails(input.demand_id);
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
        return await demandsService.update(
          demandId,
          values as any /* This is a shared route and some fields can be undefined, causing typescript errors*/,
          ctx.user.id
        );
      }),
  },
  user: {
    addRelanceComment: routeAuthenticated.input(zAddRelanceCommentInput).mutation(async ({ input, ctx }) => {
      const { relanceId, comment } = input;
      return await demandsService.updateCommentFromRelanceId(relanceId, comment, ctx.user?.id);
    }),
    create: routeAuthenticated.input(zCreateDemandInput).mutation(async ({ input, ctx }) => {
      return await demandsService.create(input, ctx.user?.id);
    }),
    list: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin']).query(async ({ ctx }) => {
      return await demandsService.listByUser(ctx.user.id);
    }),
    listEmails: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input, ctx }) => {
        return await demandsService.listEmails({ demandId: input.demand_id, userId: ctx.user.id });
      }),
    update: routeAuthenticated.input(zUserUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await demandsService.update(demandId, values as any, ctx.user?.id);
    }),
  },
});
