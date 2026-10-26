import type { ReactNode } from 'react';

type SectionIntroProps = {
  /** Small uppercase label displayed above the title. */
  eyebrow: string;
  title: string;
  /** Optional lede paragraph below the title. */
  children?: ReactNode;
};

/**
 * Heading block of a public page section: uppercase eyebrow, main title and an optional lede.
 */
export function SectionIntro({ eyebrow, title, children }: SectionIntroProps) {
  return (
    <div>
      <p className="fr-h6 mb-3 font-medium uppercase">{eyebrow}</p>
      <h2 className="fr-h2 mb-0 font-bold">{title}</h2>
      {children && <p className="mt-4 mb-0 text-lg">{children}</p>}
    </div>
  );
}
