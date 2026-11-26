import Alert from '@/components/ui/Alert';
import type { IssueSeverity } from '@/modules/data-diagnostic/types';
import trpc from '@/modules/trpc/client';

import { DataDiagnosticIssueList } from './DataDiagnosticIssueList';
import { DataDiagnosticOnDemandChecks } from './DataDiagnosticOnDemandChecks';

const severityColumns = [
  { severity: 'error', title: 'À corriger' },
  { severity: 'warning', title: 'À vérifier' },
] as const satisfies readonly { severity: IssueSeverity; title: string }[];

/**
 * Data anomalies of the admin dashboard, in two columns: the errors to fix, and the warnings to check
 * followed by the on-demand checks. Each line carries its theme and unfolds into the items to handle.
 */
export function DataDiagnosticIssues() {
  // checked again each time the dashboard is shown, and sent alone so the counters fired with it are not held back
  const { data: issues, error } = trpc.dataDiagnostic.run.useQuery(
    { onDemand: false },
    { staleTime: 0, trpc: { context: { skipBatch: true } } }
  );

  return error ? (
    <Alert variant="error" size="sm" title="Contrôle des données indisponible">
      {error.message}
    </Alert>
  ) : (
    <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
      {severityColumns.map((column) => (
        <section key={column.severity} className="flex min-w-0 flex-col gap-2">
          <h2 className="mb-0 text-base font-bold">{column.title}</h2>
          <DataDiagnosticIssueList
            issues={issues?.filter((issue) => issue.severity === column.severity)}
            emptyMessage="Aucune anomalie détectée."
          />
          {column.severity === 'warning' && <DataDiagnosticOnDemandChecks />}
        </section>
      ))}
    </div>
  );
}
