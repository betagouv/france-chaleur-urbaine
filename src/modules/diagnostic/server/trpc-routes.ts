import { runDiagnostic } from '@/modules/diagnostic/server/service';
import { router, routeRole } from '@/modules/trpc/server';

const adminRoute = routeRole(['admin']);

export const diagnosticRouter = router({
  runDiagnostic: adminRoute.query(async () => {
    return await runDiagnostic();
  }),
});
