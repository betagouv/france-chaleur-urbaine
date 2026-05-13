import { zJobListInput } from '@/modules/jobs/constants';
import { listJobs } from '@/modules/jobs/server/service';
import { adminRoute, router } from '@/modules/trpc/server';

export const jobsRouter = router({
  list: adminRoute.input(zJobListInput).query(async ({ input, ctx }) => await listJobs(input, ctx)),
});
