import { type ReactNode, useContext } from 'react';

import cx from '@/utils/cx';

import { SolutionSectionContext } from './SolutionSection';

type SolutionListItemProps = {
  children?: ReactNode;
};

/**
 * Uses checklist icons for conditions and benefits, and crosses for cautions.
 */
export function SolutionListItem({ children }: SolutionListItemProps) {
  const sectionId = useContext(SolutionSectionContext);
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
