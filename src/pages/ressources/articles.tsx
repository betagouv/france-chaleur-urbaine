import Card from '@codegouvfr/react-dsfr/Card';
import { type ReactNode } from 'react';

import { coldNetworks, growths, issues, understandings } from '@/components/Ressources/config';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Section, { SectionContent, SectionTitle } from '@/components/ui/Section';

const articlesEnjeuxReseauxDeChaleur: ArticleItemProps[] = Object.entries(issues).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const articlesComprendreReseauxDeChaleur: ArticleItemProps[] = Object.entries(understandings).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const articlesCroissance: ArticleItemProps[] = Object.entries(growths).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const articlesReseauxDeFroid: ArticleItemProps[] = Object.entries(coldNetworks).map(([key, article]) => ({
  ...article,
  slug: key,
}));

const ArticlesPage = () => {
  return (
    <SimplePage
      title="Nos articles sur la chaleur urbaine"
      description="Retrouvez les réponses à toutes vos questions sur les réseaux de chaleur et de froid."
    >
      <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline">
        <HeroTitle>Nos articles sur le chauffage urbain</HeroTitle>
        <HeroSubtitle>Retrouvez les réponses à toutes vos questions sur les réseaux de chaleur et de froid.</HeroSubtitle>
      </Hero>

      <Section>
        <SectionTitle>Les enjeux de la transition énergétique avec les réseaux de chaleur</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row fr-grid-row--gutters">
            {articlesEnjeuxReseauxDeChaleur.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section variant="light">
        <SectionTitle>Les réseaux de chaleur en pratique&nbsp;: tout comprendre pour se raccorder</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row fr-grid-row--gutters">
            {articlesComprendreReseauxDeChaleur.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Une filière en pleine croissance</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row fr-grid-row--gutters">
            {articlesCroissance.map((article, index) => (
              <ArticleItem {...article} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section variant="light">
        <SectionTitle>Les réseaux de froid&nbsp;: un enjeu pour l'avenir</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row fr-grid-row--gutters">
            {articlesReseauxDeFroid.map((article, index) => (
              <ArticleItem {...article} key={index} />
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
}

const ArticleItem = ({ title, description, slug }: ArticleItemProps) => (
  <div className="fr-col fr-col-12 fr-col-sm-6 fr-col-md-4">
    <Card
      background
      border
      desc={description}
      enlargeLink
      linkProps={{
        href: `/ressources/${slug}`,
      }}
      size="medium"
      title={title}
      titleAs="h3"
    />
  </div>
);
