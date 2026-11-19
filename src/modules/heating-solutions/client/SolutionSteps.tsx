import type { ReactNode } from 'react';

type SolutionStepsProps = {
  steps: readonly { title: string; description?: ReactNode }[];
  className?: string;
};

/**
 * Keeps project steps in one ordered list with continuous, visible numbering.
 */
export function SolutionSteps({ steps, className = '' }: SolutionStepsProps) {
  return (
    <ol role="list" className={`list-none space-y-2 pl-0 ${className}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3 rounded-2xl bg-[#f3f6fe] px-4 py-2 [&::marker]:content-none">
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4b4afb] text-sm font-bold text-white"
          >
            {index + 1}
          </span>
          <div className="min-w-0 [&_p:last-child]:mb-0">
            {step.description ? <p className="mb-1 font-bold">{step.title}</p> : step.title}
            {step.description}
          </div>
        </li>
      ))}
    </ol>
  );
}
