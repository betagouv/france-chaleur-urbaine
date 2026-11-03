import type { ReactNode } from 'react';

import cx from '@/utils/cx';

type SolutionSummaryCardProps = {
  title: string;
  tone: 'building' | 'cost' | 'feasibility' | 'benefits';
  children: ReactNode;
};

/**
 * One of the four compact introductory cards in a solution article.
 */
export function SolutionSummaryCard({ title, tone, children }: SolutionSummaryCardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl p-4 text-sm leading-6 [&_p:last-child]:mb-0 [&_ul]:mb-0 [&_ul]:pl-4 print:break-inside-avoid',
        tone === 'building' && 'bg-[#fff0ea]',
        tone === 'cost' && 'bg-[#fef7da]',
        tone === 'feasibility' && 'bg-[#e3fdeb]',
        tone === 'benefits' && 'bg-[#f3f6fe]'
      )}
    >
      <h3 className="mb-2 text-base leading-6">{title}</h3>
      {children}
    </div>
  );
}
