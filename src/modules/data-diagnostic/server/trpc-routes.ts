import { runDataDiagnostic } from '@/modules/data-diagnostic/server/service';
import { adminRoute, router } from '@/modules/trpc/server';

export const dataDiagnosticRouter = router({
  run: adminRoute.query(async () => {
    return await runDataDiagnostic();
  }),
});
