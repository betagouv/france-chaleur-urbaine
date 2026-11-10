import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import Image from 'next/image';

import Button from '@/components/ui/Button';

import type { HeatingSolution } from '../constants';
import { heatingSolutionContent } from '../content';
import { SolutionBuildingContext } from './SolutionBuildingContext';
import { SolutionTableOfContents } from './SolutionTableOfContents';

type HeatingSolutionArticleProps = {
  solution: HeatingSolution;
};

/**
 * Server-rendered solution article following the shared Figma template, with print/PDF support.
 */
export function HeatingSolutionArticle({ solution }: HeatingSolutionArticleProps) {
  const Content = heatingSolutionContent[solution.slug];
  return (
    <SolutionBuildingContext.Provider value={solution.buildingLabel}>
      <div className="grid gap-6 pb-10 lg:grid-cols-[12rem_minmax(0,1fr)] print:block print:p-0">
        <SolutionTableOfContents />
        <article className="min-w-0 text-(--text-default-grey)">
          <div className="print:hidden">
            <Breadcrumb
              currentPageLabel={solution.title}
              segments={[
                { label: 'Accueil', linkProps: { href: '/' } },
                { label: 'Articles', linkProps: { href: '/ressources/articles' } },
              ]}
            />
          </div>
          <header className="flex items-center justify-between gap-4 rounded-2xl bg-[#4b4afb] px-5 py-4 text-white md:px-7 print:border print:border-gray-300 print:bg-white print:text-black">
            <div>
              <h1 className="mb-2 text-3xl leading-10 text-white md:text-4xl print:text-black">{solution.title}</h1>
              <p className="mb-0 text-base">{solution.subtitle}</p>
            </div>
            <Image
              src={`/${solution.image}`}
              width={128}
              height={104}
              alt=""
              className="hidden h-26 w-32 shrink-0 object-contain sm:block"
            />
          </header>
          <Button priority="secondary" iconId="fr-icon-download-line" className="mt-4 print:hidden" onClick={() => window.print()}>
            Exporter la fiche en PDF
          </Button>
          <Content />
          <Button priority="secondary" iconId="fr-icon-download-line" className="mt-4 print:hidden" onClick={() => window.print()}>
            Exporter la fiche en PDF
          </Button>
        </article>
      </div>
    </SolutionBuildingContext.Provider>
  );
}
