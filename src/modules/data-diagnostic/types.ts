export type IssueSeverity = 'error' | 'warning';

export type IssueItem = {
  label: string;
  context?: string;
  href?: string;
};

export type Issue = {
  type: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  totalCount: number;
  truncated: boolean;
  items: IssueItem[];
};

export type DataDiagnosticResult = {
  generatedAt: string;
  issues: Issue[];
};
