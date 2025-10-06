import { runDiagnostic } from '@/modules/diagnostic/server/service';
import { routeRole, router } from '@/modules/trpc/server';

const adminRoute = routeRole(['admin']);

export const diagnosticRouter = router({
  run: adminRoute.query(async () => {
    return await runDiagnostic();
  }),
});
