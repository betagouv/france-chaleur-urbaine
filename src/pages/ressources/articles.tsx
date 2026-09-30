import Card from '@codegouvfr/react-dsfr/Card';
import type { ReactNode } from 'react';

import { coldNetworks, growths, issues, otherHeatingSystem, understandings } from '@/components/Ressources/config';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Section, { SectionContent, SectionTitle } from '@/components/ui/Section';

const articlesBySlug = {
  ...issues,
  ...understandings,
  ...growths,
  ...coldNetworks,
  ...otherHeatingSystem,
};

const articleSections = [
  {
    slugs: ['reseau', 'energies-vertes', 'pacImmeubleUsage'],
    title: '1. Comprendre les différentes solutions de chauffage écologique',
    variant: undefined,
  },
  {
    slugs: [
      'le-reseau-de-chaleur-un-mode-de-chauffage-aux-multiples-atouts',
      'reseau-de-chaleur-quels-avantages-par-rapport-a-un-chauffage-collectif-au-gaz-ou-au-fioul',
      'avantages-pac',
      'choix-pac',
      'qu-est-ce-qui-determine-la-faisabilite-du-raccordement-aux-reseaux-de-chaleur',
      'obligations-raccordement',
      'qu-est-ce-qu-un-reseau-de-chaleur-classe',
    ],
    title: '2. Choisir la solution adaptée à mon immeuble',
    variant: 'light',
  },
  {
    slugs: [
      'coup-de-pouce-chauffage-des-batiments-residentiels-collectifs-et-tertiaires-une-aide-consequente-pour-se-raccorder-a-un-reseau-de-chaleur',
      'combien-coute-un-raccordement-a-un-reseau-de-chaleur',
      'financer-le-raccordement-de-sa-copropriete-a-un-reseau-de-chaleur-dans-le-cadre-d-une-renovation-globale',
      'obligations-copropriété',
      'comprendre-la-facture-de-chauffage-d-une-copropriete-raccordee-a-un-reseau-de-chaleur',
      'valoriser-un-raccordement-a-un-reseau-de-chaleur-dans-le-cadre-du-dispositif-eco-energie-tertiaire',
    ],
    title: '3. Financer et piloter mon projet',
    variant: undefined,
  },
  {
    slugs: ['reseau-de-froid'],
    title: '4. Rafraîchir mon immeuble',
    variant: 'light',
  },
] as const;

const furtherReadingSlugs = [
  'reseaux-de-chaleur-un-role-cle-dans-la-transition-energetique',
  'livraisons',
  'etat',
  'quels-sont-les-principaux-acteurs-de-la-filiere-des-reseaux-de-chaleur',
] as const;

type ArticleSlug = (typeof articleSections)[number]['slugs'][number];
type FurtherReadingSlug = (typeof furtherReadingSlugs)[number];

const getSectionArticles = (slugs: readonly (ArticleSlug | FurtherReadingSlug)[]): ArticleItemProps[] =>
  slugs.map((slug) => ({
    ...articlesBySlug[slug],
    slug,
  }));

const ArticlesPage = () => {
  return (
    <SimplePage
      title="Nos articles sur les énergies renouvelables"
      description="Retrouvez les réponses à toutes vos questions sur les réseaux de chaleur, de froid et autres solutions de chauffage écologiques."
    >
      <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline" imageRatio="1/4">
        <HeroTitle>Nos articles sur les énergies renouvelables</HeroTitle>
        <HeroSubtitle>
          Retrouvez les réponses à toutes vos questions sur les réseaux de chaleur, de froid et autres solutions de chauffage écologiques.
        </HeroSubtitle>
      </Hero>

      {articleSections.map((section) => (
        <Section key={section.title} variant={section.variant}>
          <SectionTitle>{section.title}</SectionTitle>
          <SectionContent>
            <div className="fr-grid-row fr-grid-row--gutters">
              {getSectionArticles(section.slugs).map((article) => (
                <ArticleItem {...article} key={article.slug} />
              ))}
            </div>
          </SectionContent>
        </Section>
      ))}

      <Section size="sm" className="border-t border-light">
        <h2 className="mb-4w text-xl font-bold text-(--text-title-grey)">Pour aller plus loin : enjeux écologiques et économiques</h2>
        <SectionContent className="mt-0!">
          <div className="fr-grid-row fr-grid-row--gutters">
            {getSectionArticles(furtherReadingSlugs).map((article) => (
              <ArticleItem {...article} key={article.slug} size="small" />
            ))}
          </div>
        </SectionContent>
      </Section>
    </SimplePage>
  );
};

export default ArticlesPage;

interface ArticleItemProps {
  title: string;
  description: string | ReactNode;
  slug: string;
  size?: 'small' | 'medium';
}

const ArticleItem = ({ title, description, slug, size = 'medium' }: ArticleItemProps) => (
  <div className="fr-col fr-col-12 fr-col-sm-6 fr-col-md-4">
    <Card
      background
      border
      desc={description}
      enlargeLink
      linkProps={{
        href: `/ressources/${slug}`,
      }}
      size={size}
      title={title}
      titleAs="h3"
    />
  </div>
);
