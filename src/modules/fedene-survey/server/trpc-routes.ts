import { adminRoute, router } from '@/modules/trpc/server';

import { zImportFedeneInput, zResolveSurveyDiscrepancyInput } from '../constants';
import { clearSurveyDiscrepancies, importFedeneFile, listSurveyDiscrepancies, resolveSurveyDiscrepancy } from './service';

export const fedeneSurveyRouter = router({
  /** Imports the uploaded FEDENE library for real (the report of the simulation is shown first). */
  applyImport: adminRoute
    .input(zImportFedeneInput)
    .mutation(({ input, ctx }) => importFedeneFile(input, { dryRun: false, userId: ctx.user.id })),
  /** Deletes every pending survey discrepancy (recreated by the next import). */
  clearDiscrepancies: adminRoute.mutation(({ ctx }) => clearSurveyDiscrepancies({ userId: ctx.user.id })),
  listDiscrepancies: adminRoute.query(() => listSurveyDiscrepancies()),
  /** Simulation of the import of the uploaded FEDENE library: nothing is written. */
  previewImport: adminRoute
    .input(zImportFedeneInput)
    .mutation(({ input, ctx }) => importFedeneFile(input, { dryRun: true, userId: ctx.user.id })),
  /** Decides one field of a survey discrepancy: keep the FCU correction, or restore the survey value. */
  resolveDiscrepancy: adminRoute
    .input(zResolveSurveyDiscrepancyInput)
    .mutation(({ input, ctx }) => resolveSurveyDiscrepancy(input, { userId: ctx.user.id })),
});
