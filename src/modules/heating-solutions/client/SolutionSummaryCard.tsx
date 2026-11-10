import type { ReactNode } from 'react';

import cx from '@/utils/cx';

import { SolutionPictogram } from './SolutionPictogram';

type SolutionSummaryCardProps = {
  tone: keyof typeof summaryCards;
  children: ReactNode;
};

/**
 * One of the four compact introductory cards in a solution article.
 */
export function SolutionSummaryCard({ tone, children }: SolutionSummaryCardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl p-4 text-base leading-6 [&_p:last-child]:mb-0 [&_ul]:mb-0 [&_ul]:pl-4 print:break-inside-avoid',
        tone === 'building' && 'bg-[#fff0ea]',
        tone === 'cost' && 'bg-[#fef7da]',
        tone === 'feasibility' && 'bg-[#e3fdeb]',
        tone === 'benefits' && 'bg-[#f3f6fe]'
      )}
    >
      <h3 className="mb-2 text-lg leading-6">
        <SolutionPictogram icon={summaryCards[tone].icon} className="mb-1 block" />
        {summaryCards[tone].title}
      </h3>
      {children}
    </div>
  );
}

const summaryCards = {
  benefits: { icon: '🌍', title: 'Pourquoi s’y intéresser ?' },
  building: { icon: '🏢', title: 'Pour quels bâtiments ?' },
  cost: { icon: '💶', title: 'Combien ça coûte ?' },
  feasibility: { icon: '✅', title: 'C’est faisable ?' },
} as const;
