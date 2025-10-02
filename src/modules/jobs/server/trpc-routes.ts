import { zJobListInput } from '@/modules/jobs/constants';
import { listJobs } from '@/modules/jobs/server/service';
import { routeRole, router } from '@/modules/trpc/server';

const adminRoute = routeRole(['admin']);

export const jobsRouter = router({
  list: adminRoute.input(zJobListInput).query(async ({ input, ctx }) => await listJobs(input, ctx)),
});
