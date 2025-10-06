import { z } from 'zod';

import {
  zCreateEligibilityTestInput,
  zRenameEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '@/modules/pro-eligibility-tests/constants';
import { routeRole, router } from '@/modules/trpc/server';

import * as proEligibilityTestsService from './service';

const authRoute = routeRole(['admin', 'gestionnaire', 'particulier', 'professionnel', 'demo']);
const adminRoute = routeRole(['admin']);

export const proEligibilityTestsRouter = router({
  create: authRoute.input(zCreateEligibilityTestInput).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.create(input, ctx);
  }),
  delete: authRoute.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.remove(input.id, {}, ctx);
  }),
  get: authRoute.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return await proEligibilityTestsService.get(input.id, {}, ctx);
  }),
  list: authRoute.query(async ({ ctx }) => {
    return await proEligibilityTestsService.list({}, ctx);
  }),
  listAdmin: adminRoute.query(async () => {
    return await proEligibilityTestsService.listAdmin();
  }),
  markAsSeen: authRoute.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.markAsSeen(input.id, ctx);
  }),
  rename: authRoute.input(zRenameEligibilityTestInput).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.rename(input.id, input, {}, ctx);
  }),
  update: authRoute.input(zUpdateEligibilityTestInput).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.update(input.id, input, {}, ctx);
  }),
});
