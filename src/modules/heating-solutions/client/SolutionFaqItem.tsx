import type { ReactNode } from 'react';

type SolutionFaqItemProps = {
  question: string;
  children: ReactNode;
};

/**
 * Visible FAQ answer, included in both the initial HTML and the printed article.
 */
export function SolutionFaqItem({ question, children }: SolutionFaqItemProps) {
  return (
    <div className="mb-3 rounded-2xl bg-[#f3f6fe] p-4 print:break-inside-avoid">
      <h3 className="mb-2 text-base leading-6">{question}</h3>
      <div className="[&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
