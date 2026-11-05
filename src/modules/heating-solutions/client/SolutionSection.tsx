import Image from 'next/image';
import { createContext, type ReactNode } from 'react';

import cx from '@/utils/cx';

type SolutionSectionProps = {
  id: string;
  title: string;
  iconId: string;
  illustration?: 'advantages' | 'vigilance' | 'steps' | 'cost' | 'funding';
  photo?: string;
  children: ReactNode;
};

/**
 * Anchored editorial section with the template's illustration and list styling.
 */
export function SolutionSection({ id, title, iconId, illustration, photo, children }: SolutionSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="my-7 scroll-mt-6">
      <h2 id={`${id}-title`} className="mb-4 flex items-center gap-2 text-2xl leading-8 print:break-after-avoid">
        <span className={iconId} aria-hidden="true" />
        {title}
      </h2>
      <div
        className={cx(
          'gap-5 [&_p]:leading-6 [&_li]:leading-6 [&_a]:text-(--text-action-high-blue-france) [&_a]:underline [&_h3]:text-lg [&_h3]:leading-7',
          (illustration || photo) && 'md:flex md:items-start',
          illustration === 'advantages' && '[&_li]:mb-2 [&_li]:rounded-2xl [&_li]:bg-[#e3fdeb] [&_li]:px-4 [&_li]:py-2',
          illustration === 'vigilance' && '[&_li]:mb-2 [&_li]:rounded-2xl [&_li]:bg-[#fef7da] [&_li]:px-4 [&_li]:py-2',
          illustration === 'steps' && '[&_li]:mb-2 [&_li]:rounded-2xl [&_li]:bg-[#f3f6fe] [&_li]:px-4 [&_li]:py-2',
          illustration === 'cost' && 'rounded-2xl bg-[#fde2b5] p-4'
        )}
      >
        {illustration && (
          <Image
            src={`/img/heating-solutions/${illustration}.png`}
            width={illustrationSizes[illustration].width}
            height={illustrationSizes[illustration].height}
            alt=""
            className={cx(
              'mx-auto mb-4 h-auto max-w-40 shrink-0 object-contain md:mb-0 print:max-w-24',
              illustration === 'steps' && 'md:order-2',
              illustration === 'cost' || illustration === 'funding' ? 'md:w-32' : 'md:w-1/4 md:max-w-60'
            )}
          />
        )}
        {photo && (
          <Image
            src={photo}
            alt=""
            width={294}
            height={210}
            className="mx-auto mb-4 h-auto w-full max-w-72 rounded-2xl object-contain md:order-2 md:mb-0 md:w-1/3"
          />
        )}
        <div className="min-w-0 flex-1 [&>p:last-child]:mb-0">
          <SolutionSectionIllustrationContext.Provider value={illustration}>{children}</SolutionSectionIllustrationContext.Provider>
        </div>
      </div>
    </section>
  );
}

export const SolutionSectionIllustrationContext = createContext<SolutionSectionProps['illustration']>(undefined);

const illustrationSizes = {
  advantages: { height: 248, width: 260 },
  cost: { height: 104, width: 124 },
  funding: { height: 121, width: 144 },
  steps: { height: 234, width: 260 },
  vigilance: { height: 219, width: 261 },
} as const;
