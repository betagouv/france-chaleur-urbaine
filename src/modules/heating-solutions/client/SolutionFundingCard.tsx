import type { ReactNode } from 'react';

import { SolutionPictogram } from './SolutionPictogram';

type SolutionFundingCardProps = {
  kind: keyof typeof fundingIcons;
  children: ReactNode;
  className?: string;
};

/**
 * Displays a funding option with its explicit template pictogram.
 */
export function SolutionFundingCard({ kind, children, className = '' }: SolutionFundingCardProps) {
  return (
    <li
      className={`flex min-h-30 min-w-0 flex-1 list-none items-center gap-2 rounded-2xl bg-[#e3fdeb] p-4 [&::marker]:content-none ${className}`}
    >
      <SolutionPictogram icon={fundingIcons[kind]} />
      <div className="min-w-0 [&>p:last-child]:mb-0">{children}</div>
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
