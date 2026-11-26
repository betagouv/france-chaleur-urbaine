import AdminDashboardIndicators from '@/modules/admin/client/AdminDashboardIndicators';
import { DataDiagnosticIssues } from '@/modules/data-diagnostic/client/DataDiagnosticIssues';

/**
 * Admin dashboard: what awaits the FCU team. The permanent counters (work queues) at the top,
 * then the data anomalies: errors to fix and warnings to check.
 */
export default function DashboardAdmin() {
  return (
    <div className="flex flex-col gap-6 mb-5">
      <AdminDashboardIndicators />
      <DataDiagnosticIssues />
    </div>
  );
}
