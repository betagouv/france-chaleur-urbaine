import Card from '@codegouvfr/react-dsfr/Card';
import type { ReactNode } from 'react';

import { articleSections, articlesBySlug, furtherReadingSection } from '@/components/Ressources/config';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Section, { SectionContent, SectionTitle } from '@/components/ui/Section';

const getSectionArticles = (slugs: readonly string[]): ArticleItemProps[] =>
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
        <h2 className="mb-4w text-xl font-bold text-(--text-title-grey)">{furtherReadingSection.title}</h2>
        <SectionContent className="mt-0!">
          <div className="fr-grid-row fr-grid-row--gutters">
            {getSectionArticles(furtherReadingSection.slugs).map((article) => (
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
