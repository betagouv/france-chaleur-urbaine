import { zRunDataDiagnosticInput } from '@/modules/data-diagnostic/constants';
import { runDataDiagnostic } from '@/modules/data-diagnostic/server/service';
import { adminRoute, router } from '@/modules/trpc/server';

export const dataDiagnosticRouter = router({
  run: adminRoute.input(zRunDataDiagnosticInput).query(({ input }) => runDataDiagnostic(input)),
});
