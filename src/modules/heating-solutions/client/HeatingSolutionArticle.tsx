import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import SideMenu from '@codegouvfr/react-dsfr/SideMenu';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';

import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';

import type { HeatingSolution } from '../constants';
import { heatingSolutionContent } from '../content';
import { SolutionListItem } from './SolutionListItem';

type HeatingSolutionArticleProps = {
  solution: HeatingSolution;
};

/**
 * Server-rendered solution article following the shared Figma template, with print/PDF support.
 */
export function HeatingSolutionArticle({ solution }: HeatingSolutionArticleProps) {
  const Content = heatingSolutionContent[solution.slug];
  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[12rem_minmax(0,1fr)] print:block print:p-0">
      <aside className="lg:pt-20 print:hidden [&_.fr-sidemenu__link]:px-2 [&_.fr-sidemenu__link]:py-2 [&_.fr-sidemenu__link]:text-sm [&_.fr-sidemenu__link]:font-normal [&_.fr-sidemenu__link]:leading-5">
        <div className="md:hidden">
          <Accordion label="Sommaire de la fiche">
            <nav aria-label="Sommaire de la fiche">
              <ul className="mb-0 list-none pl-0">
                {sectionLinks.map(([id, text]) => (
                  <li key={id}>
                    <Link href={`#${id}`} variant="link" className="inline-block py-2">
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Accordion>
        </div>
        <div className="hidden md:block lg:sticky lg:top-6">
          <SideMenu
            title="Lire la fiche"
            burgerMenuButtonText="Sommaire de la fiche"
            items={sectionLinks.map(([id, text]) => ({ linkProps: { href: `#${id}` }, text }))}
          />
        </div>
      </aside>
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
          <Image src={`/${solution.image}`} width={128} height={104} alt="" className="hidden h-26 w-32 shrink-0 object-contain sm:block" />
        </header>
        <Button
          priority="secondary"
          size="small"
          iconId="fr-icon-download-line"
          className="mt-4 print:hidden"
          onClick={() => window.print()}
        >
          Exporter la fiche en PDF
        </Button>
        <Content components={mdxComponents} />
      </article>
    </div>
  );
}

const sectionLinks = [
  ['en-quelques-mots', 'En quelques mots'],
  ['de-quoi-sagit-il', 'De quoi s’agit-il ?'],
  ['fonctionnement', 'Comment ça marche ?'],
  ['conditions', 'Est-ce adapté à mon bâtiment ?'],
  ['avantages', 'Les principaux avantages'],
  ['vigilance', 'Les points à vérifier'],
  ['etapes', 'Les étapes du projet'],
  ['questions', 'Questions fréquentes'],
  ['cout', 'Combien ça coûte ?'],
  ['aides', 'Les aides possibles'],
  ['aller-plus-loin', 'Pour aller plus loin'],
] as const;

const mdxComponents: MDXComponents = {
  a: ({ href = '', children }) => {
    const target = href.replace('https://france-chaleur-urbaine.beta.gouv.fr', '');
    return (
      <Link href={target} variant="link" isExternal={target.startsWith('http')}>
        {children}
      </Link>
    );
  },
  li: SolutionListItem,
};
