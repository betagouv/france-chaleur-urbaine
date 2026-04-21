import { z } from 'zod';

import { networkTypes } from '@/modules/reseaux/constants';
import { route, routeRole, router } from '@/modules/trpc/server';

import {
  zAddRelanceCommentInput,
  zAdminUpdateDemandInput,
  zCreateBatchDemandInput,
  zCreateDemandInput,
  zCreateFCUTeamContactInput,
  zDeleteDemandInput,
  zGestionnaireUpdateDemandInput,
  zListEmailsInput,
  zSendEmailInput,
  zUserUpdateDemandInput,
} from '../constants';
import { changeDemandNetwork, listAdmin, removeDemand, unvalidateDemand, updateDemandByAdmin, validateDemand } from './admin-operations';
import { createBatchDemands } from './creation-batch';
import { createDemand } from './creation-user';
import { computeNetworkDistance, createFCUTeamContact, recalculateEligibility } from './eligibility';
import { listDemandEmails, sendDemandEmail } from './email-communication';
import { listDemands, requestDemandNetworkChange, updateDemandByGestionnaire } from './gestionnaire-operations';
import { updateCommentFromRelanceId, updateDemandByUser } from './relances';
import { getReseauxStats, getTagsStats } from './stats';
import { listByUser } from './user-tracking';

export const demandsRouter = router({
  admin: {
    changeNetwork: routeRole(['admin'])
      .input(
        z.object({
          demandId: z.string(),
          networkIdFcu: z.number().nullable(),
          networkType: z.enum(networkTypes).nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await changeDemandNetwork(input.demandId, input.networkIdFcu, input.networkType, ctx.user.id);
      }),
    computeNetworkDistance: routeRole(['admin'])
      .input(
        z.object({
          demandId: z.uuidv4(),
          networkIdFcu: z.number().int(),
          networkType: z.enum(networkTypes),
        })
      )
      .query(async ({ input }) => {
        return await computeNetworkDistance(input.demandId, input.networkIdFcu, input.networkType);
      }),
    delete: routeRole(['admin'])
      .input(zDeleteDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId } = input;
        await removeDemand(demandId, ctx.user.id);
      }),
    getReseauxStats: routeRole(['admin']).query(async () => getReseauxStats()),
    getTagsStats: routeRole(['admin']).query(async () => getTagsStats()),
    list: routeRole(['admin']).query(async () => {
      const result = await listAdmin();
      return result;
    }),
    recalculateEligibility: routeRole(['admin'])
      .input(z.object({ demandId: z.string() }))
      .mutation(async ({ input }) => {
        return await recalculateEligibility(input.demandId);
      }),
    unvalidate: routeRole(['admin'])
      .input(z.object({ demandId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await unvalidateDemand(input.demandId, ctx.user.id);
      }),
    update: routeRole(['admin'])
      .input(zAdminUpdateDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId, values } = input;
        return await updateDemandByAdmin(demandId, values, ctx.user.id);
      }),
    validate: routeRole(['admin'])
      .input(z.object({ demandId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await validateDemand(input.demandId, ctx.user.id);
      }),
  },
  gestionnaire: {
    list: routeRole(['gestionnaire', 'collectivite', 'alec']).query(async ({ ctx }) => {
      const permissions = await ctx.getPermissions();
      return await listDemands(ctx.user, { anonymize: ctx.anonymize, permissions });
    }),
    listEmails: routeRole(['gestionnaire', 'collectivite', 'alec', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input, ctx }) => {
        const permissions = await ctx.getPermissions();
        return await listDemandEmails({ demandId: input.demand_id, permissions, user: ctx.user });
      }),
    sendEmail: routeRole(['gestionnaire', 'collectivite', 'alec', 'admin'])
      .input(zSendEmailInput)
      .mutation(async ({ input, ctx }) => {
        await sendDemandEmail({
          demandId: input.demand_id,
          emailContent: input.emailContent,
          key: input.key,
          user: ctx.user,
        });
      }),
    update: routeRole(['gestionnaire', 'collectivite', 'alec'])
      .input(zGestionnaireUpdateDemandInput)
      .mutation(async ({ input, ctx }) => {
        const { demandId, values } = input;
        return await updateDemandByGestionnaire(demandId, values, ctx.user.id);
      }),
  },
  territory: {
    requestNetworkChange: routeRole(['collectivite', 'alec'])
      .input(z.object({ demandId: z.string(), reason: z.string().min(1), requestedSncuId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await requestDemandNetworkChange(input.demandId, input.requestedSncuId, input.reason, ctx.user.id);
      }),
  },
  user: {
    addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input, ctx }) => {
      const { relanceId, comment } = input;
      return await updateCommentFromRelanceId(relanceId, comment, ctx.user?.id);
    }),
    create: route.input(zCreateDemandInput).mutation(async ({ input, ctx }) => {
      return await createDemand(input, { userId: ctx.user?.id });
    }),
    createBatch: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin'])
      .input(zCreateBatchDemandInput)
      .mutation(async ({ input, ctx }) => {
        return await createBatchDemands(input, ctx.user);
      }),
    createFCUTeamContact: route.input(zCreateFCUTeamContactInput).mutation(async ({ input }) => {
      await createFCUTeamContact(input);
    }),
    list: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin']).query(async ({ ctx }) => {
      return await listByUser(ctx.user.id);
    }),
    listEmails: routeRole(['particulier', 'professionnel', 'gestionnaire', 'admin'])
      .input(zListEmailsInput)
      .query(async ({ input, ctx }) => {
        const permissions = await ctx.getPermissions();
        return await listDemandEmails({ demandId: input.demand_id, permissions, user: ctx.user });
      }),
    update: route.input(zUserUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await updateDemandByUser(demandId, values, ctx.user?.id);
    }),
  },
});
