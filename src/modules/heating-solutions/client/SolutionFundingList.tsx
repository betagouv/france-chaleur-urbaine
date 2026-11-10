import type { ReactNode } from 'react';

type SolutionFundingListProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Arranges funding cards in equal-width columns, stacked on small screens.
 */
export function SolutionFundingList({ children, className = '' }: SolutionFundingListProps) {
  return (
    <ul role="list" className={`flex list-none flex-col gap-3 pl-0 md:flex-row ${className}`}>
      {children}
    </ul>
  );
}
