import { z } from 'zod';

import { networkTypes } from '@/modules/reseaux/constants';
import { adminRoute, authRoute, demandAccessRoute, route, router } from '@/modules/trpc/server';

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
import {
  changeDemandAssignment,
  listAdmin,
  rejectDemandAssignmentChangeRequest,
  removeDemand,
  updateDemandByAdmin,
  validateDemand,
} from './admin-operations';
import { createBatchDemands } from './creation-batch';
import { createDemand } from './creation-user';
import { computeNetworkDistance, createFCUTeamContact, recalculateEligibility } from './eligibility';
import { listDemandEmails, sendDemandEmail } from './email-communication';
import {
  cancelDemandAssignmentChangeRequest,
  listDemands,
  requestDemandAssignmentChange,
  updateDemandByGestionnaire,
} from './gestionnaire-operations';
import { updateCommentFromRelanceId, updateDemandByUser } from './relances';
import { getReseauxStats, getTagsStats } from './stats';
import { listByUser } from './user-tracking';

const zRequestAssignmentChangeInput = z
  .object({
    comment: z.string().trim().min(1).nullable(),
    demandId: z.uuidv4(),
    networkIdFcu: z.number().int().nullable(),
    networkType: z.enum(networkTypes).nullable(),
  })
  .refine((v) => (v.networkIdFcu === null) === (v.networkType === null), {
    message: 'networkIdFcu et networkType doivent être tous les deux renseignés ou tous les deux null (désaffectation)',
    path: ['networkIdFcu'],
  });

export const demandsRouter = router({
  admin: {
    changeAssignment: adminRoute
      .input(
        z
          .object({
            demandId: z.string(),
            networkIdFcu: z.number().nullable(),
            networkType: z.enum(networkTypes).nullable(),
          })
          .refine((v) => (v.networkIdFcu === null) === (v.networkType === null), {
            message: 'networkIdFcu et networkType doivent être tous les deux renseignés ou tous les deux null (désaffectation)',
            path: ['networkIdFcu'],
          })
      )
      .mutation(async ({ input, ctx }) => {
        return await changeDemandAssignment(input.demandId, input.networkIdFcu, input.networkType, ctx.user.id);
      }),
    delete: adminRoute.input(zDeleteDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId } = input;
      await removeDemand(demandId, ctx.user.id);
    }),
    getReseauxStats: adminRoute.query(async () => getReseauxStats()),
    getTagsStats: adminRoute.query(async () => getTagsStats()),
    list: adminRoute.query(async () => {
      const result = await listAdmin();
      return result;
    }),
    recalculateEligibility: adminRoute.input(z.object({ demandId: z.string() })).mutation(async ({ input }) => {
      return await recalculateEligibility(input.demandId);
    }),
    rejectAssignmentChangeRequest: adminRoute.input(z.object({ demandId: z.uuidv4() })).mutation(async ({ input, ctx }) => {
      await rejectDemandAssignmentChangeRequest(input.demandId, ctx.user.id);
    }),
    update: adminRoute.input(zAdminUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await updateDemandByAdmin(demandId, values, ctx.user.id);
    }),
    validate: adminRoute.input(z.object({ demandId: z.string() })).mutation(async ({ input, ctx }) => {
      await validateDemand(input.demandId, ctx.user.id);
    }),
  },
  gestionnaire: {
    cancelAssignmentChangeRequest: demandAccessRoute.input(z.object({ demandId: z.uuidv4() })).mutation(async ({ input, ctx }) => {
      await cancelDemandAssignmentChangeRequest(input.demandId, ctx.user.id);
    }),
    computeNetworkDistance: demandAccessRoute
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
    list: demandAccessRoute.query(async ({ ctx }) => listDemands(ctx)),
    listEmails: demandAccessRoute.input(zListEmailsInput).query(async ({ input, ctx }) => {
      return await listDemandEmails(ctx, { demandId: input.demand_id });
    }),
    requestAssignmentChange: demandAccessRoute.input(zRequestAssignmentChangeInput).mutation(async ({ input, ctx }) => {
      await requestDemandAssignmentChange(input.demandId, input.networkIdFcu, input.networkType, input.comment, ctx.user.id);
    }),
    sendEmail: demandAccessRoute.input(zSendEmailInput).mutation(async ({ input, ctx }) => {
      await sendDemandEmail(ctx, {
        demandId: input.demand_id,
        emailContent: input.emailContent,
        key: input.key,
      });
    }),
    update: demandAccessRoute.input(zGestionnaireUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await updateDemandByGestionnaire(demandId, values, ctx.user.id);
    }),
  },
  user: {
    addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input, ctx }) => {
      const { relanceId, comment } = input;
      return await updateCommentFromRelanceId(relanceId, comment, ctx.user.id);
    }),
    create: route.input(zCreateDemandInput).mutation(async ({ input, ctx }) => {
      return await createDemand(input, { userId: ctx.user.id });
    }),
    createBatch: authRoute.input(zCreateBatchDemandInput).mutation(async ({ input, ctx }) => {
      return await createBatchDemands(input, ctx.user);
    }),

    createFCUTeamContact: route.input(zCreateFCUTeamContactInput).mutation(async ({ input }) => {
      await await createFCUTeamContact(input);
    }),
    list: authRoute.query(async ({ ctx }) => {
      return await listByUser(ctx.user.id);
    }),
    update: route.input(zUserUpdateDemandInput).mutation(async ({ input, ctx }) => {
      const { demandId, values } = input;
      return await updateDemandByUser(demandId, values, ctx.user.id);
    }),
  },
});
