import { Badge } from '@codegouvfr/react-dsfr/Badge';

import Accordion from '@/components/ui/Accordion';
import Alert from '@/components/ui/Alert';
import Link from '@/components/ui/Link';
import { adminDashboardThemeLabels } from '@/modules/admin/constants';
import { issueSeverityDsfr, MAX_ITEMS_PER_ISSUE } from '@/modules/data-diagnostic/constants';
import type { Issue, IssueItem } from '@/modules/data-diagnostic/types';
import cx from '@/utils/cx';

type DataDiagnosticIssueProps = {
  issue: Issue;
};

/** One detected anomaly, as a compact line: count, title and theme, unfolding into how to fix it and the concerned items, each linking to the screen where it is handled. */
const DataDiagnosticIssue = ({ issue }: DataDiagnosticIssueProps) => {
  const countLabel = issue.truncated ? `${MAX_ITEMS_PER_ISSUE}+` : `${issue.totalCount}`;

  const label = (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Badge severity={issueSeverityDsfr[issue.severity]} small noIcon>
        {countLabel}
      </Badge>
      <span className="flex-1 min-w-0 font-medium">{issue.title}</span>
      <span className="hidden shrink-0 text-xs font-normal text-faded sm:inline">{adminDashboardThemeLabels[issue.theme]}</span>
    </div>
  );

  return (
    <Accordion bordered small label={label} id={issue.type} lazy>
      <p className="mb-3">{issue.description}</p>
      {issue.truncated && (
        <Alert variant="info" size="sm" className="mb-3" title="Résultat tronqué">
          Plus de {MAX_ITEMS_PER_ISSUE} éléments concernés. Seuls les {MAX_ITEMS_PER_ISSUE} premiers sont affichés.
        </Alert>
      )}
      <ul className="list-none pl-0 m-0 flex flex-col">
        {issue.items.map((item, index) => (
          <li key={`${issue.type}-${index}`}>
            <IssueItemContent item={item} />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

type IssueItemContentProps = {
  item: IssueItem;
};

const itemClassName = 'block py-1.5 px-2 -mx-2 rounded transition-colors';

const IssueItemContent = ({ item }: IssueItemContentProps) => {
  const content = (
    <>
      <div className="font-medium wrap-break-word">{item.label}</div>
      {item.context && <div className="text-sm text-faded wrap-break-word">{item.context}</div>}
    </>
  );

  const main = item.href ? (
    <Link href={item.href} className={cx(itemClassName, 'no-underline! text-current! bg-none! hover:bg-(--background-default-grey-hover)')}>
      {content}
    </Link>
  ) : (
    <div className={itemClassName}>{content}</div>
  );

  return item.links?.length ? (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">{main}</div>
      {item.links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm shrink-0">
          {link.label}
        </Link>
      ))}
    </div>
  ) : (
    main
  );
};

export default DataDiagnosticIssue;
