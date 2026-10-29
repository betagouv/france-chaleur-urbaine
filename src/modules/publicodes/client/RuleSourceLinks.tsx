import { Fragment } from 'react';

import Link from '@/components/ui/Link';
import cx from '@/utils/cx';

import type { RuleSource } from '../explanation-model';

type RuleSourceLinksProps = {
  sources: RuleSource[];
  /** What to render when the rule has no source: a muted dash by default, nothing with `null` */
  fallback?: React.ReactNode;
  /** Prefix the list with « Source : » (sentence form) */
  withLabel?: boolean;
  className?: string;
};

/**
 * Sources of a rule as compact inline links (external) or plain labels, the full note on hover.
 */
export function RuleSourceLinks({
  sources,
  fallback = <span className="text-faded">—</span>,
  withLabel = false,
  className,
}: RuleSourceLinksProps) {
  if (sources.length === 0) {
    return <>{fallback}</>;
  }
  const prefix = withLabel ? 'Source : ' : '';
  const tooltip = (source: RuleSource) => (source.inheritedFrom ? `${source.raw}\n(source de « ${source.inheritedFrom} »)` : source.raw);
  return (
    <span className={cx('inline', className)}>
      {prefix}
      {sources.map((source, sourceIndex) => (
        <Fragment key={source.raw}>
          {sourceIndex > 0 && ', '}
          {source.url ? (
            <Link href={source.url} isExternal title={tooltip(source)} className="text-xs">
              {source.label}
            </Link>
          ) : (
            <span title={tooltip(source)} className="text-xs">
              {source.label}
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}
