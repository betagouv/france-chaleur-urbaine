import type { AdminDashboardThemeId } from '@/modules/admin/constants';

export type IssueSeverity = 'error' | 'warning';

export type IssueItem = {
  label: string;
  context?: string;
  href?: string;
  links?: { label: string; href: string }[];
};

export type Issue = {
  type: string;
  severity: IssueSeverity;
  theme: AdminDashboardThemeId;
  title: string;
  description: string;
  totalCount: number;
  truncated: boolean;
  items: IssueItem[];
};
