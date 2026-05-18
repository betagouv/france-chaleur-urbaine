import { runDiagnostic } from '@/modules/diagnostic/server/service';
import { adminRoute, router } from '@/modules/trpc/server';

export const diagnosticRouter = router({
  run: adminRoute.query(async () => {
    return await runDiagnostic();
  }),
});
