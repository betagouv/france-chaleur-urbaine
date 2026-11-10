import { useContext } from 'react';

import Accordion from '@/components/ui/Accordion';
import Link from '@/components/ui/Link';

import { getSolutionSectionTitle, solutionSections } from '../article-sections';
import { SolutionBuildingContext } from './SolutionBuildingContext';
import { SolutionPictogram } from './SolutionPictogram';

/**
 * Shares the article's section labels and pictograms across desktop and mobile navigation.
 */
export function SolutionTableOfContents() {
  const buildingLabel = useContext(SolutionBuildingContext);
  const navigation = (
    <nav aria-label="Sommaire de la fiche">
      <ul className="mb-0 list-none pl-0">
        {solutionSections.map((section) =>
          section.id === 'aides' ? null : (
            <li key={section.id} className="mb-0">
              <Link href={`#${section.id}`} variant="link" className="inline-flex items-start gap-1 py-2 text-sm leading-5 text-black">
                <SolutionPictogram icon={section.icon} />
                {getSolutionSectionTitle(section.id, buildingLabel)}
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );

  return (
    <aside className="lg:pt-20 print:hidden">
      <div className="md:hidden">
        <Accordion label="Liens rapides">{navigation}</Accordion>
      </div>
      <div className="hidden md:block lg:sticky lg:top-6">
        <p className="mb-2 text-sm font-bold">Liens rapides</p>
        {navigation}
      </div>
    </aside>
  );
}
