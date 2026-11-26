import type { Issue } from '@/modules/data-diagnostic/types';

import DataDiagnosticIssue from './DataDiagnosticIssue';

type DataDiagnosticIssueListProps = {
  /** `undefined` while the checks run */
  issues: Issue[] | undefined;
  emptyMessage: string;
};

/** A list of anomalies, one compact expandable line each, or what stands for it while the checks run or when nothing is wrong. */
export function DataDiagnosticIssueList({ issues, emptyMessage }: DataDiagnosticIssueListProps) {
  return !issues ? (
    <p className="mb-0 text-sm text-faded">Contrôle en cours…</p>
  ) : issues.length === 0 ? (
    <p className="mb-0 text-sm text-faded">{emptyMessage}</p>
  ) : (
    <div className="flex flex-col gap-2">
      {issues.map((issue) => (
        <DataDiagnosticIssue key={issue.type} issue={issue} />
      ))}
    </div>
  );
}
