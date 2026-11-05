import { type ReactNode, useContext } from 'react';

import { SolutionSectionIllustrationContext } from './SolutionSection';

type SolutionListItemProps = {
  children?: ReactNode;
};

/**
 * Uses the template's checklist icons for benefits and cautions, retaining ordinary lists elsewhere.
 */
export function SolutionListItem({ children }: SolutionListItemProps) {
  const illustration = useContext(SolutionSectionIllustrationContext);
  if (illustration !== 'advantages' && illustration !== 'vigilance') {
    return <li>{children}</li>;
  }
  return (
    <li className="flex list-none items-start gap-2 [&::marker]:content-none">
      <span
        aria-hidden="true"
        className={
          illustration === 'advantages'
            ? 'fr-icon-checkbox-circle-line shrink-0 text-[#18753c]'
            : 'fr-icon-alert-line shrink-0 text-[#b34000]'
        }
      />
      <div>{children}</div>
    </li>
  );
}
