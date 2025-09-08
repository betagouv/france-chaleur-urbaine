import { z } from 'zod';

import { zCreateEligibilityTestInput, zUpdateEligibilityTestInput } from '@/modules/pro-eligibility-tests/constants';
import { route, router, routeRole } from '@/modules/trpc/server';

import * as proEligibilityTestsService from './service';

const authRoute = routeRole(['admin', 'gestionnaire']);
const adminRoute = routeRole(['admin']);

export const proEligibilityTestsRouter = router({
  create: route.input(zCreateEligibilityTestInput).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.create(input, ctx);
  }),
  update: route.input(zUpdateEligibilityTestInput).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.update(input.id, input, {}, ctx);
  }),
  list: authRoute.query(async ({ ctx }) => {
    return await proEligibilityTestsService.list({}, ctx);
  }),
  get: authRoute.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return await proEligibilityTestsService.get(input.id, {}, ctx);
  }),
  delete: authRoute.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.remove(input.id, {}, ctx);
  }),
  markAsSeen: authRoute.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    return await proEligibilityTestsService.markAsSeen(input.id, ctx);
  }),
  listAdmin: adminRoute.query(async () => {
    return await proEligibilityTestsService.listAdmin();
  }),
});
