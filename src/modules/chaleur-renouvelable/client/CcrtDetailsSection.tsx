import type { ReactNode } from 'react';

type CcrtDetailsSectionProps = { title: string; children: ReactNode; description?: ReactNode };

/**
 * Consistent panel for the building and simulation sections.
 */
export function CcrtDetailsSection({ title, children, description }: CcrtDetailsSectionProps) {
  return (
    <section className="border border-(--border-default-grey) bg-(--background-default-grey) px-6 py-4 [&_.fr-label]:text-sm [&_.fr-label]:leading-6 [&_.fr-label]:text-(--text-default-grey)">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-(--border-default-grey) pb-2">
        <h3 className="mb-0 text-lg leading-7 font-bold text-(--text-title-grey)">{title}</h3>
        {description && <p className="mb-0 break-all text-sm leading-6 text-(--text-default-grey)">{description}</p>}
      </div>
      {children}
    </section>
  );
}
