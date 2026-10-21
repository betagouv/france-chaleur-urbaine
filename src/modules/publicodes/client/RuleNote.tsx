import cx from '@/utils/cx';

import type { RuleAnnotation } from '../explanation-model';
import { RuleSourceLinks } from './RuleSourceLinks';

type RuleNoteProps = {
  annotation: RuleAnnotation;
  /** Sentence form with a « Source : » / « Note : » label, for headers; bare inline otherwise */
  withLabel?: boolean;
  /** What to render when the rule has neither source nor note: a muted dash by default, nothing with `null` */
  fallback?: React.ReactNode;
  className?: string;
};

/**
 * What justifies a rule: its sources as links, or else its note as a muted remark (a justification of the formula, a caveat).
 */
export function RuleNote({ annotation, withLabel = false, fallback = <span className="text-faded">—</span>, className }: RuleNoteProps) {
  if (annotation.sources.length > 0) {
    return <RuleSourceLinks sources={annotation.sources} withLabel={withLabel} className={className} />;
  }
  if (!annotation.remark) {
    return <>{fallback}</>;
  }
  return (
    <span className={cx('text-xs text-gray-600', className)} title={annotation.remark}>
      {withLabel && 'Note : '}
      {annotation.remark}
    </span>
  );
}
