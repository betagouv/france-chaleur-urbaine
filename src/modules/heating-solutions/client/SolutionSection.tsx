import Image from 'next/image';
import { createContext, type ReactNode, useContext } from 'react';

import cx from '@/utils/cx';

import { getSolutionSection, getSolutionSectionTitle, type SolutionSectionId } from '../article-sections';
import { SolutionBuildingContext } from './SolutionBuildingContext';
import { SolutionPictogram } from './SolutionPictogram';

type SolutionSectionProps = {
  id: SolutionSectionId;
  photo?: string;
  children: ReactNode;
};

/**
 * Anchored editorial section with the template's illustration and list styling.
 */
export function SolutionSection({ id, photo, children }: SolutionSectionProps) {
  const buildingLabel = useContext(SolutionBuildingContext);
  const section = getSolutionSection(id);
  const illustration = sectionIllustrations[id];
  const Heading = id === 'aides' ? 'h3' : 'h2';
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="my-7 scroll-mt-6">
      <Heading
        id={`${id}-title`}
        className={cx('mb-4 flex items-center gap-2 leading-8 print:break-after-avoid', id === 'aides' ? 'text-xl' : 'text-2xl')}
      >
        {section.icon && <SolutionPictogram icon={section.icon} />}
        {getSolutionSectionTitle(id, buildingLabel)}
      </Heading>
      <div
        className={cx(
          'gap-5 [&_p]:leading-6 [&_li]:leading-6 [&_a:not(.fr-btn)]:text-(--text-action-high-blue-france) [&_h3]:text-lg [&_h3]:leading-7 [&_strong]:font-bold',
          (illustration || photo) && 'md:flex md:items-start',
          id === 'conditions' &&
            '[&_ul]:grid [&_ul]:list-none [&_ul]:gap-3 [&_ul]:pl-0 [&_ul]:sm:grid-cols-2 [&_ul]:lg:grid-cols-4 [&_li]:min-h-28 [&_li]:rounded-2xl [&_li]:bg-[#f3f6fe] [&_li]:px-4 [&_li]:py-4',
          illustration === 'advantages' && '[&_li]:mb-2 [&_li]:rounded-2xl [&_li]:bg-[#e3fdeb] [&_li]:px-4 [&_li]:py-2',
          illustration === 'vigilance' && '[&_li]:mb-2 [&_li]:rounded-2xl [&_li]:bg-[#fef7da] [&_li]:px-4 [&_li]:py-2',
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
        <div className={cx('min-w-0 flex-1 [&>p:last-child]:mb-0', id === 'aller-plus-loin' && 'grid gap-4 md:grid-cols-2')}>
          <SolutionSectionContext.Provider value={id}>{children}</SolutionSectionContext.Provider>
        </div>
      </div>
    </section>
  );
}

export const SolutionSectionContext = createContext<SolutionSectionId | undefined>(undefined);

const sectionIllustrations: Partial<Record<SolutionSectionId, keyof typeof illustrationSizes>> = {
  aides: 'funding',
  avantages: 'advantages',
  cout: 'cost',
  etapes: 'steps',
  vigilance: 'vigilance',
};

const illustrationSizes = {
  advantages: { height: 248, width: 260 },
  cost: { height: 104, width: 124 },
  funding: { height: 121, width: 144 },
  steps: { height: 234, width: 260 },
  vigilance: { height: 219, width: 261 },
} as const;
