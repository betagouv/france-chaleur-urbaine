import { type ReactNode, useContext } from 'react';

import cx from '@/utils/cx';

import { SolutionPictogram } from './SolutionPictogram';
import { SolutionSectionContext } from './SolutionSection';

type SolutionListItemProps = {
  children?: ReactNode;
  funding?: keyof typeof fundingIcons;
};

/**
 * Renders funding pictograms, checklist icons for conditions and benefits, and crosses for cautions.
 */
export function SolutionListItem({ children, funding }: SolutionListItemProps) {
  const sectionId = useContext(SolutionSectionContext);
  if (funding) {
    return (
      <li className="flex list-none items-center gap-2 [&::marker]:content-none">
        <SolutionPictogram icon={fundingIcons[funding]} />
        <div className="min-w-0 [&>p:last-child]:mb-0">{children}</div>
      </li>
    );
  }
  if (sectionId === 'etapes') {
    return (
      <li>
        <div className="min-w-0 [&>p:last-child]:mb-0">{children}</div>
      </li>
    );
  }
  if (sectionId !== 'conditions' && sectionId !== 'avantages' && sectionId !== 'vigilance') {
    return <li>{children}</li>;
  }
  return (
    <li className={cx('flex list-none gap-2 [&::marker]:content-none', sectionId === 'conditions' ? 'items-center' : 'items-start')}>
      <span
        aria-hidden="true"
        className={
          sectionId === 'vigilance' ? 'fr-icon-close-line shrink-0 text-[#b34000]' : 'fr-icon-checkbox-circle-line shrink-0 text-[#18753c]'
        }
      />
      <div>{children}</div>
    </li>
  );
}

const fundingIcons = {
  cee: '🎟️',
  financing: '🏦',
  heatFund: '🔥',
  local: '📍',
  renovation: '🏠',
} as const;
